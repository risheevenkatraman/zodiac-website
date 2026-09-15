# Zodiac Esports

## Description

Zodiac Esports is a responsive team and community website for the organization's
Overwatch and VALORANT rosters. It combines team profiles, news, match schedules,
merchandise, and a customer loyalty program called **Stars**.

## Features

- Team rosters with searchable players, roles, and signature heroes or agents.
- Individual player and staff profiles with biographies, photos, and social links.
- Homepage announcements, community events, and automated FACEIT match schedules.
- A form-based content editor with image uploads, drafts, review, and publishing.
- Merchandise collections with variant selection, availability, and a shopping bag
  that persists within the browser tab.
- Shopify-hosted checkout and Shop Pay where enabled by the store.
- Shopify customer sign-in and a personal Stars dashboard.
- Stars earned from eligible purchases and redeemable for customer-specific,
  single-use discount codes.
- Lifetime membership tiers: **Zodiac Bronze**, **Zodiac Silver**, **Zodiac Gold**,
  **Zodiac Diamond**, and **Zodiac Nebula**. Redeeming Stars preserves tier progress;
  refunds adjust eligible earnings.
- Verified purchase notifications, duplicate protection, and retry handling for
  rewards and discounts.
- Responsive layouts, keyboard navigation, and reduced-motion support.

Commerce, customer accounts, content publishing, and rewards require their
associated services to be configured. The initial Stars policy supports USD shop
currency with tax- and duty-exclusive pricing.

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | HTML5, CSS3, and vanilla JavaScript |
| Content | JSON, local image assets, and Decap CMS |
| Profile generation | Python scripts generating static player and staff pages |
| Match schedules | FACEIT Data API and scheduled synchronization |
| Commerce | Shopify Storefront API, hosted checkout, and Shop Pay |
| Customer authentication | Shopify Customer Account API with OAuth and PKCE |
| Backend | Python AWS Lambda functions behind Amazon API Gateway |
| Rewards storage | Amazon DynamoDB with transactional updates and Streams |
| Background processing | Amazon SQS with retries and dead-letter queues |
| Secrets and monitoring | AWS Secrets Manager and Amazon CloudWatch |
| Infrastructure | AWS SAM and CloudFormation |
| Hosting and automation | AWS Amplify Hosting, GitHub, and GitHub Actions; an existing GitHub Pages workflow remains for migration |
| Validation | Python unittest, Moto AWS mocks, Node.js checks, Playwright browser checks, and CloudFormation linting |
