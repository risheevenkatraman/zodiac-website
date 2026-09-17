# Zodiac Esports

## Description

Established in 2024, Zodiac Esports is an esports organization and community. This
responsive website showcases its Overwatch and VALORANT rosters. It combines team profiles, news, match schedules,
merchandise, and a customer loyalty program called **Stars**.

## Features

- Flagship and academy team rosters for Overwatch and VALORANT.
- Animated zodiac constellations with selectable player stars.
- Player and staff profiles that open in place, with photos, biographies, and social icons.
- Homepage announcements and a star-themed events timeline with FACEIT match updates.
- Official merchandise store with product variants, a persistent shopping bag, and Shopify checkout.
- Shopify customer accounts and the Stars loyalty program with five membership tiers.
- Rewards earning, redemption, and purchase history.
- Content editing with image uploads, drafts, review, and publishing.
- Responsive layouts, keyboard navigation, and reduced-motion support.

## Implementation stack

| Area | Implementation |
| --- | --- |
| Frontend | Next.js App Router, React, CSS, and static export |
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
