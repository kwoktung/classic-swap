# Crypto Trading API

This project provides a set of API endpoints for cryptocurrency trading and information retrieval.

## Features

- Token price fetching
- Account balance checking
- Token swapping
- Quote generation

## API Endpoints

### GET /api/price
Fetches the prices of specified tokens.

### GET /api/balance
Retrieves the balance of specified tokens for a given account address.

### GET /api/swap
Executes a token swap transaction.

### GET /api/quote
Generates a quote for a potential token swap.

## Technologies Used

- Next.js API Routes
- Zod for request validation
- Viem for Ethereum address validation
- Lodash for utility functions

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run the development server with `npm run dev`

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.