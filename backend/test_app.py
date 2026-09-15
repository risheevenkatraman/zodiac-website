import base64
import copy
import hashlib
import hmac
import json
import os
import unittest
from unittest.mock import patch

import boto3
from moto import mock_aws
import app

CUSTOMER = 'gid://shopify/Customer/10'


def order(amount='350.90', **changes):
    result = {'id': 'gid://shopify/Order/1', 'name': '#1001', 'updatedAt': '2026-09-14T12:00:00Z',
        'test': False, 'cancelledAt': None, 'displayFinancialStatus': 'PAID', 'taxesIncluded': False,
        'customer': {'id': CUSTOMER}, 'currentSubtotalPriceSet': {'shopMoney': {'amount': amount, 'currencyCode': 'USD'}},
        'netPaymentSet': {'shopMoney': {'amount': amount, 'currencyCode': 'USD'}}}
    return {**result, **changes}


@mock_aws
class RewardsTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {'AWS_DEFAULT_REGION': 'us-east-1', 'TABLE_NAME': 'rewards',
            'SHOP_DOMAIN': 'zodiac.myshopify.com', 'CUSTOMER_API_URL': 'https://shopify.test/graphql',
            'SITE_ORIGIN': 'https://zodiac.test', 'PUBLIC_API_URL': 'https://api.zodiac.test'})
        self.env.start()
        self.addCleanup(self.env.stop)
        boto3.client('dynamodb').create_table(TableName='rewards', BillingMode='PAY_PER_REQUEST',
            KeySchema=[{'AttributeName': 'pk', 'KeyType': 'HASH'}, {'AttributeName': 'sk', 'KeyType': 'RANGE'}],
            AttributeDefinitions=[{'AttributeName': 'pk', 'AttributeType': 'S'}, {'AttributeName': 'sk', 'AttributeType': 'S'}])
        self.db = app.table()

    def reconcile(self, snapshot, oid='1'):
        with patch.object(app, 'order_snapshot', return_value=snapshot):
            app.reconcile(oid)

    def balance(self, customer=CUSTOMER):
        return self.db.get_item(Key={'pk': customer, 'sk': 'BALANCE'}, ConsistentRead=True)['Item']

    def redeem(self, request_id='11111111-1111-1111-1111-111111111111'):
        with patch.object(app, 'authenticated_customer', return_value=CUSTOMER):
            return app.redeem({'body': json.dumps({'requestId': request_id})})

    def test_paid_duplicate_and_refund_are_reconciled(self):
        self.reconcile(order())
        self.reconcile(order())
        self.assertEqual(self.balance()['available'], 350)
        self.reconcile(order('149.99', displayFinancialStatus='PARTIALLY_REFUNDED'))
        self.assertEqual(self.balance()['available'], 149)
        self.assertEqual(self.balance()['earned'], 149)
        self.reconcile(order('0', displayFinancialStatus='REFUNDED'))
        self.assertEqual(self.balance()['available'], 0)

    def test_redeeming_never_reduces_lifetime_or_double_spends(self):
        self.reconcile(order())
        self.assertEqual(self.redeem()['statusCode'], 202)
        self.assertEqual(self.redeem()['statusCode'], 202)
        self.assertEqual(self.balance()['available'], 250)
        self.assertEqual(self.balance()['earned'], 350)
        self.assertEqual(app.tier_progress(350)['tier'], 'Zodiac Silver')

    def test_insufficient_balance_and_refunded_spend(self):
        self.assertEqual(self.redeem()['statusCode'], 409)
        self.reconcile(order('100'))
        self.assertEqual(self.redeem()['statusCode'], 202)
        self.assertEqual(self.redeem('22222222-2222-2222-2222-222222222222')['statusCode'], 409)
        self.reconcile(order('0', displayFinancialStatus='REFUNDED'))
        self.assertEqual(self.balance()['available'], -100)
        self.reconcile(order('50'), oid='2')
        self.assertEqual(self.balance()['available'], -50)

    def test_customer_reassignment_moves_stars(self):
        self.reconcile(order())
        self.reconcile(order(customer={'id': 'gid://shopify/Customer/20'}))
        self.assertEqual(self.balance()['available'], 0)
        self.assertEqual(self.balance('gid://shopify/Customer/20')['available'], 350)

    def test_unpaid_cancelled_and_test_orders_do_not_earn(self):
        for changes in ({'test': True}, {'cancelledAt': '2026-09-14'}, {'displayFinancialStatus': 'PENDING'}):
            self.assertEqual(app.calculate_stars(order(**changes)), 0)
        with self.assertRaises(ValueError):
            app.calculate_stars(order(taxesIncluded=True))
        self.assertEqual(app.calculate_stars(order('-1')), 0)

    def test_all_tier_boundaries(self):
        for name, threshold in [(t['name'], t['stars']) for t in app.POLICY['tiers']]:
            self.assertEqual(app.tier_progress(threshold)['tier'], name)
        self.assertIsNone(app.tier_progress(3000)['nextTier'])

    def test_shipping_tax_and_cash_refunds_are_excluded(self):
        snapshot = order('100', displayFinancialStatus='PARTIALLY_REFUNDED')
        snapshot['netPaymentSet']['shopMoney']['amount'] = '95'
        snapshot['currentTotalTaxSet'] = {'shopMoney': {'amount': '5', 'currencyCode': 'USD'}}
        snapshot['currentShippingPriceSet'] = {'shopMoney': {'amount': '10', 'currencyCode': 'USD'}}
        self.assertEqual(app.calculate_stars(snapshot), 80)

    def test_verified_customer_is_only_source_of_identity(self):
        with patch.object(app, 'request_json', return_value={'data': {'customer': {'id': CUSTOMER}}}) as request:
            result = app.authenticated_customer({'headers': {'Authorization': 'Bearer trusted'}, 'queryStringParameters': {'customer': 'attacker'}})
            self.assertEqual(result, CUSTOMER)
            self.assertEqual(request.call_args.args[2]['Authorization'], 'trusted')
        self.assertIsNone(app.authenticated_customer({'headers': {}}))

    def test_discount_retries_reuse_code_and_balance(self):
        self.reconcile(order())
        self.redeem()
        key = {'pk': CUSTOMER, 'sk': 'REDEEM#11111111-1111-1111-1111-111111111111'}
        with patch.object(app, 'admin_graphql', side_effect=[{'codeDiscountNodeByCode': None}, RuntimeError('Timeout')]):
            with self.assertRaises(RuntimeError):
                app.issue_discount(key)
        with patch.object(app, 'admin_graphql', return_value={'codeDiscountNodeByCode': {'id': 'discount'}}) as request:
            app.issue_discount(key)
            app.issue_discount(key)
            self.assertEqual(request.call_count, 1)
        self.assertEqual(self.balance()['available'], 250)
        self.assertEqual(self.db.get_item(Key=key)['Item']['status'], 'READY')

    def test_discount_is_single_use_and_customer_bound(self):
        self.reconcile(order())
        self.redeem()
        key = {'pk': CUSTOMER, 'sk': 'REDEEM#11111111-1111-1111-1111-111111111111'}
        with patch.object(app, 'admin_graphql', side_effect=[{'codeDiscountNodeByCode': None},
                {'discountCodeBasicCreate': {'codeDiscountNode': {'id': 'discount'}, 'userErrors': []}}]) as request:
            app.issue_discount(key)
            value = request.call_args.args[1]['input']
            self.assertEqual(value['context']['customers']['add'], [CUSTOMER])
            self.assertEqual(value['usageLimit'], 1)

    def test_hmac_covers_raw_bytes_and_rejects_wrong_shop(self):
        raw = b'{"id":1}'
        signature = base64.b64encode(hmac.new(b'secret', raw, hashlib.sha256).digest()).decode()
        self.assertTrue(app.verify_webhook(raw, signature, 'secret'))
        self.assertFalse(app.verify_webhook(raw + b' ', signature, 'secret'))
        with patch.object(app, 'credentials', return_value={'shopifyWebhookSecret': 'secret'}):
            result = app.webhook({'body': raw.decode(), 'headers': {'x-shopify-hmac-sha256': signature,
                'x-shopify-shop-domain': 'other.myshopify.com'}})
            self.assertEqual(result['statusCode'], 403)

    def test_oauth_state_is_browser_bound_and_one_use(self):
        with patch.object(app, 'credentials', return_value={'githubClientId': 'client', 'githubClientSecret': 'secret'}):
            start = app.oauth({'rawPath': '/auth'})
            cookie = start['cookies'][0].split(';')[0]
            state = cookie.split('=')[1]
            event = {'rawPath': '/callback', 'queryStringParameters': {'state': state, 'code': 'code'}}
            self.assertEqual(app.oauth(event)['statusCode'], 400)
            event['cookies'] = [cookie]
            with patch.object(app, 'request_json', return_value={'access_token': 'github-token'}):
                result = app.oauth(event)
                self.assertEqual(result['statusCode'], 200)
                self.assertIn('event.origin !== origin', result['body'])
                self.assertEqual(app.oauth(event)['statusCode'], 400)


if __name__ == '__main__':
    unittest.main()
