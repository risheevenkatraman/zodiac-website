"""Retry one pending discount using operator AWS credentials; does not spend again."""
import argparse
import re
from app import issue_discount

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--customer-id', required=True)
parser.add_argument('--request-id', required=True)
args = parser.parse_args()
if not re.fullmatch(r'gid://shopify/Customer/[0-9]+', args.customer_id):
    parser.error('Invalid customer ID')
if not re.fullmatch(r'[a-f0-9-]{36}', args.request_id):
    parser.error('Invalid redemption request ID')
issue_discount({'pk': args.customer_id, 'sk': 'REDEEM#' + args.request_id})
print('Discount is ready. No additional Stars were spent.')
