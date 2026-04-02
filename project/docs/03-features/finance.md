# Finance Module

The Finance module provides a comprehensive suite of tools for tracking family financial activities, including transactions, categories, and summary metrics.

## Features

- **Transaction Management**: Record income and expenses with detailed metadata (date, category, amount, description).
- **Summary Dashboard**: Real-time overview of Total Balance, Total Income, and Total Expenses.
- **Categorization**: Organize transactions into custom or system-defined categories.
- **Multi-Currency Support**: Unified financial tracking across different currencies.
- **Localization**: Fully localized interface supporting English and Indonesian.

## Usage

### Recording a Transaction
1. Navigate to the **Finance** section from the sidebar.
2. Click the **Add Transaction** button.
3. Fill in the transaction details (Amount, Date, Category, and Type).
4. Save to update your balance and history.

### Managing Categories
Categories can be managed via the **Master Data > Categories** section, allowing for granular control over financial reporting.

## Localization Structure
The module uses a flattened, dot-notated i18n structure for maximum compatibility:
- `finance.transactions.table.date`
- `finance.summary.total_balance`
- `finance.modal.add_title`
