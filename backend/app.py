"""Zodiac AWS API, Decap OAuth bridge, and verified Shopify Stars worker."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from decimal import Decimal, ROUND_FLOOR
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

_secrets = None
_secrets_at = 0
_admin_token = None
_admin_expires = 0
POLICY = json.loads(Path(__file__).with_name('rewards-policy.json').read_text())


def encode_item(item):
    from boto3.dynamodb.types import TypeSerializer
    serializer = TypeSerializer()
    return {k: serializer.serialize(v) for k, v in item.items()}


def tier_progress(earned):
    tier = POLICY['tiers'][0]
    for candidate in POLICY['tiers']:
        if earned >= candidate['stars']:
            tier = candidate
    next_tier = next((t for t in POLICY['tiers'] if t['stars'] > earned), None)
    return {'tier': tier['name'], 'nextTier': next_tier}


def aws(service):
    import boto3
    return boto3.client(service)


def table():
    import boto3
    return boto3.resource('dynamodb').Table(os.environ['TABLE_NAME'])


def credentials():
    global _secrets, _secrets_at
    if _secrets is None or time.time() - _secrets_at > 300:
        _secrets = json.loads(aws('secretsmanager').get_secret_value(
            SecretId=os.environ['SECRET_ARN'])['SecretString'])
        _secrets_at = time.time()
    return _secrets


def request_json(url, data, headers=None):
    raw = data if isinstance(data, bytes) else json.dumps(data).encode()
    req = Request(url, data=raw, headers={
        'Content-Type': 'application/json', 'Accept': 'application/json',
        'User-Agent': 'ZodiacWebsite', **(headers or {})})
    with urlopen(req, timeout=12) as response:
        return json.load(response)


def response(status, data, headers=None):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json',
        'Cache-Control': 'no-store', **(headers or {})}, 'body': json.dumps(data)}


def headers(event):
    return {k.lower(): v for k, v in (event.get('headers') or {}).items()}


def verify_webhook(raw, signature, secret):
    expected = base64.b64encode(hmac.new(secret.encode(), raw, hashlib.sha256).digest()).decode()
    return bool(signature) and hmac.compare_digest(expected, signature)


def webhook(event):
    h = headers(event)
    raw = base64.b64decode(event['body']) if event.get('isBase64Encoded') else (event.get('body') or '').encode()
    if not verify_webhook(raw, h.get('x-shopify-hmac-sha256', ''), credentials()['shopifyWebhookSecret']):
        return response(401, {'error': 'Invalid signature'})
    if h.get('x-shopify-shop-domain') != os.environ['SHOP_DOMAIN']:
        return response(403, {'error': 'Unexpected shop'})
    topic = h.get('x-shopify-topic')
    if topic not in ('orders/paid', 'orders/updated', 'orders/cancelled', 'refunds/create'):
        return response(400, {'error': 'Unsupported topic'})
    data = json.loads(raw)
    order_id = str(data.get('order_id') if topic == 'refunds/create' else data.get('id'))
    if not re.fullmatch(r'[1-9][0-9]*', order_id):
        return response(400, {'error': 'Invalid order'})
    # Acknowledge only after durable enqueue. FIFO serializes updates for an order.
    aws('sqs').send_message(QueueUrl=os.environ['QUEUE_URL'],
        MessageBody=json.dumps({'order_id': order_id}), MessageGroupId=order_id,
        MessageDeduplicationId=hashlib.sha256(raw + h.get('x-shopify-event-id', '').encode()).hexdigest())
    return response(200, {'accepted': True})


def admin_token():
    global _admin_token, _admin_expires
    c = credentials()
    if c.get('shopifyAdminAccessToken'):
        return c['shopifyAdminAccessToken']
    if time.time() >= _admin_expires:
        result = request_json(f"https://{os.environ['SHOP_DOMAIN']}/admin/oauth/access_token",
            urlencode({'grant_type': 'client_credentials', 'client_id': c['shopifyClientId'],
                       'client_secret': c['shopifyClientSecret']}).encode(),
            {'Content-Type': 'application/x-www-form-urlencoded'})
        _admin_token = result['access_token']
        _admin_expires = time.time() + int(result['expires_in']) - 60
    return _admin_token


def order_snapshot(order_id):
    result = request_json(f"https://{os.environ['SHOP_DOMAIN']}/admin/api/2026-07/graphql.json", {
        'query': '''query RewardOrder($id: ID!) { order(id: $id) {
          id name updatedAt test cancelledAt displayFinancialStatus taxesIncluded dutiesIncluded
          customer { id }
          currentSubtotalPriceSet { shopMoney { amount currencyCode } }
          currentTotalTaxSet { shopMoney { amount currencyCode } }
          currentShippingPriceSet { shopMoney { amount currencyCode } }
          currentTotalDutiesSet { shopMoney { amount currencyCode } }
          currentTotalAdditionalFeesSet { shopMoney { amount currencyCode } }
          totalTipReceivedSet { shopMoney { amount currencyCode } }
          netPaymentSet { shopMoney { amount currencyCode } }
        } }''', 'variables': {'id': 'gid://shopify/Order/' + order_id}},
        {'X-Shopify-Access-Token': admin_token()})
    if result.get('errors') or not result.get('data', {}).get('order'):
        raise RuntimeError('Shopify order lookup failed')
    return result['data']['order']


def calculate_stars(order, currency='USD'):
    if order['test'] or order['cancelledAt'] or order['displayFinancialStatus'] not in ('PAID', 'PARTIALLY_REFUNDED'):
        return 0
    money = order['currentSubtotalPriceSet']['shopMoney']
    if money['currencyCode'] != currency:
        raise ValueError('Order shop currency does not match the rewards currency')
    amount = Decimal(money['amount'])
    # Tax-inclusive shops require line-level allocation; fail closed instead of
    # silently awarding tax as merchandise. The deployment guide requires USD,
    # tax-exclusive pricing for this initial policy.
    if order['taxesIncluded'] or order.get('dutiesIncluded'):
        raise ValueError('Tax/duty-inclusive orders require a rewards policy adapter')
    # Cash-only adjustments may not change the merchandise subtotal. Never award
    # more Stars than the amount still paid, even for those partial refunds.
    net_merchandise = Decimal(order['netPaymentSet']['shopMoney']['amount'])
    for field in ('currentTotalTaxSet', 'currentShippingPriceSet', 'currentTotalDutiesSet',
                  'currentTotalAdditionalFeesSet', 'totalTipReceivedSet'):
        money = order.get(field)
        if money:
            net_merchandise -= Decimal(money['shopMoney']['amount'])
    amount = min(amount, net_merchandise)
    return max(0, int(amount.to_integral_value(rounding=ROUND_FLOOR)))


def reconcile(order_id):
    order = order_snapshot(order_id)
    db = table()
    owner_key = {'pk': 'ORDER#' + order_id, 'sk': 'OWNER'}
    old = db.get_item(Key=owner_key, ConsistentRead=True).get('Item', {})
    customer = (order.get('customer') or {}).get('id')
    # FIFO guarantees only one worker for this order. Transaction moves ownership
    # atomically if a merchant reassigns the order to another customer.
    encode = encode_item
    actions = []
    previous_stars = int(old.get('stars', 0))
    def adjust_balance(owner, delta):
        if delta:
            actions.append({'Update': {'TableName': db.name,
                'Key': encode({'pk': owner, 'sk': 'BALANCE'}),
                'UpdateExpression': 'ADD available :delta, earned :delta',
                'ExpressionAttributeValues': encode({':delta': delta})}})
    if old.get('customer') and old['customer'] != customer:
        adjust_balance(old['customer'], -previous_stars)
        actions.append({'Delete': {'TableName': db.name, 'Key': encode({
            'pk': old['customer'], 'sk': 'ORDER#' + order_id})}})
    stars = 0
    if customer:
        stars = calculate_stars(order, POLICY['currency'])
        adjust_balance(customer, stars - (previous_stars if old.get('customer') == customer else 0))
        actions.append({'Put': {'TableName': db.name, 'Item': encode({
            'pk': customer, 'sk': 'ORDER#' + order_id, 'stars': stars,
            'name': order['name'], 'updatedAt': order['updatedAt']})}})
    actions.append({'Put': {'TableName': db.name, 'Item': encode({**owner_key, 'customer': customer or '', 'stars': stars})}})
    aws('dynamodb').transact_write_items(TransactItems=actions)


def worker(event, context):
    for record in event['Records']:
        reconcile(json.loads(record['body'])['order_id'])


def authenticated_customer(event):
    authorization = headers(event).get('authorization', '')
    if not authorization.startswith('Bearer ') or len(authorization) > 16000:
        return None
    # Validate the opaque customer token with Shopify. Ignore caller-supplied IDs.
    result = request_json(os.environ['CUSTOMER_API_URL'],
        {'query': '{ customer { id } }'}, {'Authorization': authorization[7:]})
    customer = result.get('data', {}).get('customer')
    if result.get('errors') or not customer:
        return None
    return customer['id']


def stars(event):
    customer = authenticated_customer(event)
    if not customer:
        return response(401, {'error': 'Sign in required'})
    db, orders, cursor = table(), [], None
    while True:
        kwargs = {'KeyConditionExpression': 'pk = :pk',
                  'ExpressionAttributeValues': {':pk': customer},
                  'ConsistentRead': True}
        if cursor:
            kwargs['ExclusiveStartKey'] = cursor
        page = db.query(**kwargs)
        orders.extend(page.get('Items', []))
        cursor = page.get('LastEvaluatedKey')
        if not cursor:
            break
    balance = next((item for item in orders if item['sk'] == 'BALANCE'), {})
    earned = max(0, int(balance.get('earned', 0)))
    redemptions = [item for item in orders if item['sk'].startswith('REDEEM#')]
    orders = [item for item in orders if item['sk'].startswith('ORDER#')]
    orders.sort(key=lambda item: item['updatedAt'], reverse=True)
    return response(200, {'stars': max(0, int(balance.get('available', 0))),
        'lifetimeStars': earned, **tier_progress(earned),
        'reward': {k: POLICY[k] for k in ('redemptionStars', 'discountAmount', 'minimumPurchase', 'currency')},
        'redemptions': [{'id': item['sk'][7:], 'status': item['status'],
            'code': item.get('code', '') if item['status'] == 'READY' else '',
            'amount': item['amount'], 'minimumPurchase': item['minimumPurchase']} for item in redemptions],
        'policy': 'Earn 1 Star per whole USD of eligible merchandise after discounts, excluding tax and shipping. Refunds adjust earned Stars. Redeeming Stars does not lower your tier.',
        'orders': [{'name': item['name'], 'stars': int(item['stars'])} for item in orders[:20]]})


def redeem(event):
    customer = authenticated_customer(event)
    if not customer:
        return response(401, {'error': 'Sign in required'})
    payload = json.loads(event.get('body') or '{}')
    request_id = payload.get('requestId', '')
    if not isinstance(request_id, str) or not re.fullmatch(r'[a-f0-9-]{36}', request_id):
        return response(400, {'error': 'Invalid request ID'})
    db = table()
    key = {'pk': customer, 'sk': 'REDEEM#' + request_id}
    if db.get_item(Key=key, ConsistentRead=True).get('Item'):
        return response(202, {'accepted': True})
    # Reserve Stars and create a durable job in a single transaction. A DynamoDB
    # stream issues the discount; retries never spend Stars twice.
    item = {**key, 'kind': 'redemption', 'status': 'PENDING',
        'cost': POLICY['redemptionStars'], 'amount': POLICY['discountAmount'],
        'minimumPurchase': POLICY['minimumPurchase'],
        'code': 'ZODIAC-' + secrets.token_hex(12).upper(),
        'createdAt': datetime.now(timezone.utc).isoformat()}
    try:
        aws('dynamodb').transact_write_items(TransactItems=[
            {'Update': {'TableName': db.name, 'Key': encode_item({'pk': customer, 'sk': 'BALANCE'}),
                'ConditionExpression': 'available >= :cost',
                'UpdateExpression': 'ADD available :negative',
                'ExpressionAttributeValues': encode_item({':cost': POLICY['redemptionStars'], ':negative': -POLICY['redemptionStars']})}},
            {'Put': {'TableName': db.name, 'Item': encode_item(item), 'ConditionExpression': 'attribute_not_exists(pk)'}}])
    except Exception as error:
        if getattr(error, 'response', {}).get('Error', {}).get('Code') == 'TransactionCanceledException':
            if db.get_item(Key=key, ConsistentRead=True).get('Item'):
                return response(202, {'accepted': True})
            return response(409, {'error': 'Not enough available Stars. Refresh your balance.'})
        raise
    return response(202, {'accepted': True})


def admin_graphql(query, variables):
    result = request_json(f"https://{os.environ['SHOP_DOMAIN']}/admin/api/2026-07/graphql.json",
        {'query': query, 'variables': variables}, {'X-Shopify-Access-Token': admin_token()})
    if result.get('errors'):
        raise RuntimeError('Shopify request failed')
    return result['data']


def issue_discount(key):
    db = table()
    item = db.get_item(Key=key, ConsistentRead=True)['Item']
    if item['status'] != 'PENDING':
        return
    found = admin_graphql('query($code: String!) { codeDiscountNodeByCode(code: $code) { id } }', {'code': item['code']})
    if not found['codeDiscountNodeByCode']:
        result = admin_graphql('''mutation($input: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $input) {
            codeDiscountNode { id } userErrors { code }
          }
        }''', {'input': {
            'title': 'Zodiac Stars ' + item['code'], 'code': item['code'], 'startsAt': item['createdAt'],
            'context': {'customers': {'add': [item['pk']]}},
            'customerGets': {'value': {'discountAmount': {'amount': item['amount'], 'appliesOnEachItem': False}}, 'items': {'all': True}},
            'minimumRequirement': {'subtotal': {'greaterThanOrEqualToSubtotal': item['minimumPurchase']}},
            'usageLimit': 1, 'appliesOncePerCustomer': True,
            'combinesWith': {'orderDiscounts': False, 'productDiscounts': False, 'shippingDiscounts': False}}})
        if result['discountCodeBasicCreate']['userErrors']:
            # Keep the reservation on ambiguous failure; retry looks up the same
            # code before creating it. Never refund points for a possibly live code.
            raise RuntimeError('Discount creation failed')
    db.update_item(Key=key, UpdateExpression='SET #status = :ready',
        ExpressionAttributeNames={'#status': 'status'}, ExpressionAttributeValues={':ready': 'READY'})


def discount_worker(event, context):
    for record in event['Records']:
        keys = record['dynamodb']['Keys']
        issue_discount({'pk': keys['pk']['S'], 'sk': keys['sk']['S']})


def oauth(event):
    path = event['rawPath']
    c = credentials()
    # API Gateway supplies this context; do not trust the caller's Host header.
    # Resolving at request time avoids a CloudFormation API <-> Lambda cycle.
    api_url = os.environ.get('PUBLIC_API_URL') or ('https://' + event['requestContext']['domainName'])
    callback = api_url.rstrip('/') + '/callback'
    if path == '/auth':
        state = secrets.token_urlsafe(32)
        table().put_item(Item={'pk': 'AUTH#' + state, 'sk': 'STATE', 'expires': int(time.time()) + 600})
        url = 'https://github.com/login/oauth/authorize?' + urlencode({
            'client_id': c['githubClientId'], 'redirect_uri': callback, 'state': state, 'scope': 'repo'})
        result = response(302, {}, {'Location': url})
        result['cookies'] = [f'zodiac_oauth={state}; Path=/callback; Max-Age=600; Secure; HttpOnly; SameSite=Lax']
        return result
    params = event.get('queryStringParameters') or {}
    state = params.get('state', '')
    cookie = SimpleCookie()
    cookie.load('; '.join(event.get('cookies') or []))
    browser_state = cookie.get('zodiac_oauth')
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}', state) or not browser_state or not hmac.compare_digest(browser_state.value, state):
        return response(400, {'error': 'Invalid sign-in state. Close this window and sign in again.'})
    record = table().delete_item(Key={'pk': 'AUTH#' + state, 'sk': 'STATE'}, ReturnValues='ALL_OLD').get('Attributes')
    if not record or record['expires'] < time.time() or not params.get('code'):
        return response(400, {'error': 'Sign-in expired or cancelled. Please try again.'})
    token = request_json('https://github.com/login/oauth/access_token', {
        'client_id': c['githubClientId'], 'client_secret': c['githubClientSecret'],
        'code': params['code'], 'redirect_uri': callback})
    if not token.get('access_token'):
        return response(401, {'error': 'GitHub sign-in failed'})
    # Decap's popup handshake. Tokens go only to our exact configured origin.
    origin = json.dumps(os.environ['SITE_ORIGIN']).replace('<', '\\u003c')
    message = json.dumps('authorization:github:success:' + json.dumps({
        'token': token['access_token'], 'provider': 'github'})).replace('<', '\\u003c')
    nonce = secrets.token_urlsafe(24)
    body = f'''<!doctype html><html><head><title>Zodiac sign-in</title></head><body>
    <p>Completing sign-in. You may close this window when the editor opens.</p>
    <script nonce="{nonce}">
    const origin = {origin};
    window.addEventListener('message', function receive(event) {{
      if (event.origin !== origin || event.source !== window.opener || event.data !== 'authorizing:github') return;
      window.removeEventListener('message', receive);
      window.opener.postMessage({message}, origin);
      window.close();
    }});
    if (window.opener) window.opener.postMessage('authorizing:github', origin);
    </script></body></html>'''
    return {'statusCode': 200, 'headers': {'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': f"default-src 'none'; script-src 'nonce-{nonce}'; frame-ancestors 'none'; base-uri 'none'"},
        'cookies': ['zodiac_oauth=; Path=/callback; Max-Age=0; Secure; HttpOnly; SameSite=Lax'], 'body': body}


def handler(event, context):
    try:
        route = event.get('routeKey')
        if route == 'POST /webhooks/shopify':
            return webhook(event)
        if route == 'GET /me/stars':
            return stars(event)
        if route == 'POST /me/redeem':
            return redeem(event)
        if route in ('GET /auth', 'GET /callback'):
            return oauth(event)
        return response(404, {'error': 'Not found'})
    except Exception as error:
        # Do not log tokens, order payloads, or customer information.
        print('Request failed:', type(error).__name__)
        return response(503, {'error': 'Service temporarily unavailable. Please try again.'})
