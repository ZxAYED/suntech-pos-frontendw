<!--
IMPLEMENTATION NOTES — FOR THE CODING AGENT ONLY; DO NOT DISPLAY.
Deliverable: finished copy for ONE Admin help page. This is not an audit or a request to change business logic.
Suggested page title: Help — Admin. Suggested route: /admin/help. Sidebar label: Help.
The route is proposed, not an existing route verified in the upload.
Basis: the owner's screenshots and src/ in "frontend some part.zip". Use this upload over older chat summaries.
Render the content below. Keep heading order and exact bold button labels. These labels help users find existing controls; do not rename application buttons in this task.
Reuse the existing dashboard layout and Admin access rules. No Super Admin instructions. Cashier gets a separate guide. Do not expose this guide through the Cashier sidebar.
The owner will choose tabs/accordion/design later. Headings are content groups, not a requirement to build separate routes. No new API, state library, dependency, financial calculation, or backend change is needed.
To save agent tokens: use this finished copy directly; do not regenerate it, reread all old audits, or repeat it in your completion message. Share existing Help rendering between roles where useful, but do not require Admin readers to open the Cashier guide.
Keep warnings short. Examples are teaching examples, not live shop data. Screenshots are reference material, not customer data to ship in the help page.
Only the text outside HTML comments is user-facing.
-->

# Help — Admin

Use this guide when you need help with your shop.

Find the page name below. Follow the steps in order. The words in **bold** are the words to look for on the screen.

**Start here:** Choose your business and branch → Add a category → Add a product → Add a variant → Sell the item.

## Find what you need

| I want to… | Open this part |
|---|---|
| Sign in or use the buttons | [Start here](#1-start-here) |
| Choose or add a shop | [Business and branch](#2-business-and-branch) |
| Add items, prices, stock, or photos | [Catalog](#3-catalog--add-and-manage-items) |
| Sell an item already on the screen | [Catalog Register](#4-catalog-register--sell-a-saved-item) |
| Sell a service or an item not in the list | [Quick Custom Sale](#5-quick-custom-sale--type-an-item-and-sell-it) |
| Find a sale, print a bill, or give money back | [Store Orders](#6-store-orders--find-a-sale-print-or-refund) |
| Check the shop's sales and cash | [Dashboard](#7-dashboard--check-the-shop) |
| Add or manage a cashier | [Staff](#8-staff--manage-cashier-accounts) |
| Pay salary or check salary advances | [Payroll](#9-payroll--salary-and-advances) |
| Record shop spending | [Expenses](#10-expenses--record-shop-spending) |
| Check or download sales reports | [Reports](#11-reports--check-sales-over-time) |
| See who changed something | [Audit Logs](#12-audit-logs--see-who-did-what) |
| Fix a common problem | [When you need help](#13-when-you-need-help) |
| Understand a word on the screen | [Simple word guide](#14-simple-word-guide) |

## 1. Start here

### Sign in

1. Open the sign-in page and choose **Admin**.
2. Type your **Admin Email** and **Password**.
3. Click **Sign in as Admin**.
4. Check the business and branch shown on the left before you work.

**Remember:** Use your own account. Do not give your Admin password to a cashier.

### Forgot your password?

1. On the Admin sign-in form, click **Forgot password?**
2. Enter your **Administrator Email**. Click **Send recovery code**.
3. Check that email account for the six-digit code.
4. On the reset page, enter the email, **6-Digit Reset Code**, and **New Password**.
5. Click **Verify code and update password**. Then **Return to sign in**.

**Remember:** Never give your password or recovery code to another person. Check the spam folder if the email is missing.

### Buttons you will use often

| Button or picture | What it does |
|---|---|
| **Save**, **Confirm**, or a blue action button | Does the action named on that form. Check the details first. |
| **Cancel** | Closes the form without submitting that form. It does not undo an earlier save. |
| **×** at the top of a box | Closes the box. |
| Pencil picture | Opens an item so you can change it. |
| Bin picture | Starts removing an item. Read any message before you confirm. |
| **…** | Opens more actions for that row. |
| **Retry** on a loading error | Tries to load that list again. A payment retry has special steps; see part 13. |
| **Rows** | Chooses how many lines to show on one page. It does not add or remove records. |
| **> / Next page** | Shows the next page of results. It does not save anything. |
| **< / Previous page** | Returns to the previous page. |
| **>> / Last page**, **<< / First page** | Goes to the last or first page of results. |

For money boxes, type whole taka, such as **500**. For quantity or stock, type the number of items.

A grey button may not be ready to use. You may need to fill a box, select an item, or wait for the page to finish.

On a small screen, use the menu button at the top to open the left menu. A wide table may need to be moved sideways to see **Actions**.

### Sign out

Click **Sign out** in the left menu, or the exit picture near your name at the top.

**Remember:** Finish or check any waiting sale before you sign out. Sign out when another person will use the computer.

## 2. Business and branch

**Page:** Business & Branch Selection. Open it with **Switch** beside the branch name.

A **business** is your shop business. A **branch** is one shop location. One business can have more than one branch.

### Choose where you will work

1. Click **Switch**.
2. Open **01. Business Selection**.
3. Find the business and click **Select Business**. For the current business, click **View Branches**.
4. In **02. Branch Location**, find the branch and click **Select Branch**.
5. The app opens **Catalog Register**. Check the branch name again.

The selected business and branch tell the app which shop you are working in. Stock and sales can differ between branches.

**Remember:** Do not switch shops during an unfinished sale. If the app says a money action is still unclear, check that action first.

### Add a business

1. Open **01. Business Selection**.
2. Click **Add Business**.
3. Enter the business **Name**.
4. Click **Save**. Find the new business in the list.
5. Choose it, then add a branch.

### Add a branch

1. Choose the business first. Open **02. Branch Location**.
2. Click **Add Branch**.
3. Enter the branch **Name**, such as “Uttara Branch”.
4. Enter the **Address** if available.
5. Click **Save**, then **Select Branch** to work there.

### Change or remove a business or branch

To change its details, click the pencil beside it, change the name or address shown in the form, and click **Save**.

To remove it, click the bin and read the message. Confirm only when you are sure. A message may explain why it cannot be removed.

**Remember:** Do not remove a shop just to switch away from it. Use **Switch**. If removal is blocked, do not delete staff or records only to get past the message.

### What the summary boxes mean

**Total Businesses** is the number of businesses in your list. **Branches in Business** is the branch count for the chosen business. **Current Active Branch** is the branch you are working in.

The current-branch card has **Open Catalog Register** and **Go to Operations Dashboard**. These buttons open those pages; they do not make a sale.

## 3. Catalog — add and manage items

**Open:** Left menu → **Catalog**.

This page prepares items for selling. **Catalog Register** is a different page: it is where you sell them.

### Understand the three parts

| Part | Simple meaning | Example |
|---|---|---|
| Category | A group of items | Mobile Phones |
| Product | The item name | Phone A |
| Variant | The exact kind you sell, with its own price and stock | Black / 128 GB |

**Correct order:** Category → Product → First variant.

Even when there is only one kind, add one variant. You can call it **Default**. A product name alone is not ready to sell.

### A. Create a category

1. Click **New Category**.
2. In **Category name**, type a short group name, such as “Mobile Phones”.
3. Add a **Description** if useful. You may leave it empty.
4. Click **Create category**.

**Result:** You can now choose that category when adding a product.

### B. Create a product

1. Click **New Product**.
2. In **Step 1 — product**, enter the **Product name**.
3. Add a short **Description** if useful.
4. Choose the correct **Category**. Check it even if one is already selected.
5. Click **Create & continue**.

**Result:** The product is saved. The next box is **Step 2 — first variant**. Continue below; setup is not finished yet.

### C. Add the first variant

Fill in the boxes in **Step 2 — first variant**:

| Box | What to type |
|---|---|
| **Variant name** | The kind, size, or colour. Example: “Black / 128 GB”. Use “Default” for one kind only. |
| **SKU (auto if empty)** | Your short item code. You may leave it empty for the app to make a code. |
| **Barcode** | The item's barcode, if it has one. Otherwise leave it empty. |
| **Selling price** | The price the customer pays for ONE item, in taka. |
| **Cost price** | What the shop paid for ONE item, if known. This is not the selling price. |
| **Stock** | How many of this exact variant are in the selected branch. The box starts at 0. |

1. Check the price and stock.
2. Click **Finish product**.
3. Check the variant in the Catalog table, then find it in **Catalog Register**.

**Example:** Add “Phone A”, then “Black / 128 GB”, selling price 20,000 BDT, cost price 18,000 BDT, stock 5. You now have one sellable variant with five units in this branch.

**Remember:** Stock belongs to the selected branch. Closing step 2 does not remove the product saved in step 1.

### D. Finish a product you left halfway

If a message says a product has no variants, click **Add Variant** beside that product. If **Resume setup** is shown, use it to return to the first-variant form.

Enter the variant details and finish the form. Do not create the same product again.

### E. Add another kind of an existing product

1. Click **New Variant**, or the add-variant button beside the product in the lower **Products** list.
2. In **Choose product**, choose the existing product if it is not already chosen.
3. Enter the new variant name, code, prices, and stock.
4. Click **Add variant**.

For example, add “Blue / 256 GB” under “Phone A”. It has separate stock from “Black / 128 GB”.

### F. Find items and read the numbers

Use the search box for a product, variant, SKU, or barcode. Use **All categories** to show one category, or return to all categories. Use the arrows and **Rows** below the table to see more items.

| Number | What it tells you |
|---|---|
| **Products** | Product names in the catalog. |
| **Units in branch** | The stock count shown for the branch. This is not the number of product names. |
| **Low stock SKUs** | Variants with a low recorded stock count. |
| **Inventory value** | The app's value of stock using recorded item costs. It is not money in the cash drawer. |

One product can have several rows because it has several variants. Check the variant name below the product name.

The lower **Categories** list also lets you filter by a category. Its arrow shows or hides more details. The lower **Products** list contains product-level actions.

### G. Change names, details, or prices

- **Category:** Find it in **Categories**, click its pencil, change the details, and click **Save category**.
- **Product:** Find it in **Products**, click its pencil, change the details, and click **Save**.
- **Variant:** Click the pencil on the variant row. Change the needed fields and click **Save variant**.

**Remember:** Check the correct variant before changing a price or stock. If the app refuses a change because the item has been used, keep the record and ask for help.

### H. Correct the branch stock count

1. Find the variant row.
2. Click the small box-with-plus button. Its name is **Set branch stock**.
3. Enter the **full new stock count** for this branch.
4. Click **Update stock**.

**Example:** The app shows 10. You count 15 in the shop. Enter **15**, not 5. This button replaces the count; it does not add your number to the old count.

**Remember:** Check the real items before changing stock. A negative count means the record is below zero; tell the right person and correct it after checking.

### I. Add or change item photos

1. Find the variant and click its picture button, **Manage images**.
2. Click **Set profile** to choose its main photo.
3. Click **Add gallery** to choose extra photos.
4. Wait for the upload to finish. Check the pictures in the box.
5. Use **Remove profile** to remove the main photo, or the bin on a gallery photo to remove that photo.

Use a clear photo of the correct item. The app accepts JPG, PNG, and WebP pictures.

### J. Remove an item you do not need

Use the bin beside the category, product, or variant. Read the name and the removal message before confirming.

**Remember:** Removing an item is not the same as refunding a sale. If the app blocks removal because of stock or past use, do not remove other records to force it.

## 4. Catalog Register — sell a saved item

**Open:** Left menu → **Catalog Register**. The Admin page says **Catalog Register (Admin Desk)**.

### Make a sale

1. Check the branch name at the top.
2. Find the item using search, the category buttons, or **All categories**. You can search a SKU or barcode too.
3. Check the variant name and price on the card. Different variants can appear as separate cards.
4. Click the blue **+** on the correct card. It appears in **Current ticket** on the right.
5. Use **+** or **−** in the ticket to change the number. Use **×** to remove one line.
6. Add the other items. Check **Subtotal**.
7. Click **Add Customer** to enter a name and phone, if the customer agrees. Click **Done** after typing.
8. Choose how the customer paid.
9. For cash, enter **Cash Given**, or use **Exact** if the customer gave the exact total.
10. Check the items, number, total, and payment choice. Click **Complete sale** once.
11. Wait for the saved sale and receipt. Print or save the receipt if needed.

An open shift is not required to make a sale. Do not stop a correct sale only because the screen says **No active shift**.

Scroll down for more item cards. You can also click **Scroll down to load more** when shown. If your shop uses a connected barcode scanner, scanning can add a matching item; check the item and quantity in the ticket before paying.

### Choose the correct payment

| Choice on screen | Use it when… |
|---|---|
| **Cash (COD)** | The customer gives you cash. |
| **bKash** | You have checked that the bKash payment was received. |
| **Nagad** | You have checked that the Nagad payment was received. |
| **Bank / Card** | You have checked the payment through the shop's bank or card process. |

Choosing a payment label records the method. It is not proof that a phone or bank payment arrived.

### Cash example

Two items at 200 BDT each cost **400 BDT**. The customer gives **500 BDT**. Enter **500** in **Cash Given**. **Change** is **100 BDT** to give back.

**Exact** fills in 400. Use it only if the customer gives 400.

### Customer name and phone

Without a name, the sale uses **Walk-in Customer**. This is allowed.

A correct name helps you recognise the sale later. The phone can be kept with the sale and receipt. Ask before entering it and check the digits. Future customer-help features may use these details, but this page does not promise messages, rewards, or reminders.

### Hold a ticket and return to it

Click the pause button, **Hold ticket**, to keep the current item list for later in this browser tab. It appears under **Held in this tab**. This is not a paid sale.

Finish or hold the next customer's ticket before opening a held one. Click the held ticket to bring its items back. Recheck customer details and payment before finishing.

The bin beside **Current ticket**, **Clear cart**, removes the current unsaved item list. It does not cancel a saved sale.

**Remember:** Check the item, amount, payment, and change before **Complete sale**. If the result is unclear or a price-change message appears, follow part 13 instead of making a second sale.

## 5. Quick Custom Sale — type an item and sell it

**Open:** Left menu → **Quick Custom Sale**. The Admin heading is **Direct Custom Sale (Admin Desk)**.

Use this for a service or an item you need to type yourself. It does not add a product to Catalog or reduce catalog stock.

1. Check the branch.
2. In **Product or service name**, enter a clear name, such as “Screen protector fitting”.
3. Add **Variant or style** only if useful.
4. Enter **Unit price (BDT)** for one item and **Quantity**.
5. Check **Line total**. Use **Add another item** for another line; use the line's bin to remove an extra line.
6. Add **Customer name** and **Customer phone** if wanted.
7. Choose **Payment method**.
8. For cash, enter **Paid amount (BDT)**, or click **Exact** for the exact total received.
9. Check **Total**, then click **Complete sale** once.
10. Wait for the receipt.

**Example:** Fitting costs 100 BDT each. Quantity 2 gives a line total of 200 BDT.

**Remember:** For an item already kept in Catalog, use **Catalog Register** so its stock is updated. Confirm the real payment before saving a custom sale.

## 6. Store Orders — find a sale, print, or refund

**Open:** Left menu → **Store Orders**. Page heading: **Store Orders & Sales**.

### Find and check a sale

1. Search by invoice, customer, or item.
2. Use **All statuses**, **All payments**, or **All order types** to narrow the list.
3. Find the row and click **…** → **View details**.
4. Check its customer, date, seller, branch, payment, items, quantities, and total.

An **invoice** is the sale's bill number. Keep that number when asking for help.

**Paid** means the sale is recorded as paid. **Refunded** means all eligible items have been refunded. **Partially refunded** means only part has been refunded.

### Print or save the bill

1. In the sale's **…** menu, click **Print receipt**. You can also use it inside **View details**.
2. In **Order Receipt**, choose **Print (P)** to print, **PDF** for the PDF action, or **TXT** to save a simple text copy.
3. Follow the print or save window that opens. For a printer, check the printer and paper choice.

Printing again does not create another sale. You can close the receipt without undoing the sale.

### Give money back for returned items

1. Find the original sale. Click **…** → **Refund**.
2. In **Prepare refund**, enter the number being returned for each item. Leave other lines at 0.
3. Check **Refundable**. It shows how many can still be returned.
4. Add a **Reason**, such as “Wrong size”, if useful.
5. Check **Refund total** carefully.
6. Click **Confirm refund** once. Wait for confirmation and the updated order status.

**Example:** Three items cost 200 BDT each. Returning one item gives a 200 BDT refund, not 600 BDT. The other two remain sold.

The form does not offer a new payment-method choice. Do not expect it to send money to a bank or phone account for you. Handle the real return of money through the shop's process, once only.

**Remember:** Confirm the returned items and money before clicking. A refund that has already been recorded must not be entered again.

## 7. Dashboard — check the shop

**Open:** Left menu → **Dashboard**. Page heading: **Operations Dashboard**.

Check the selected branch first.

| Part | How to use it |
|---|---|
| **Today's net sales** | Read the day's sales figure after the refunds included by the report. This is not the cash in the drawer. |
| **Cash in drawer** | The app's expected cash for the shift shown. It is not a physical cash count. |
| **Low stock SKUs** | See how many variants need a stock check. |
| **Today's expenses** | Read expenses recorded for the day. |
| **Today's Live Receipts** | Review the displayed bills. Check their dates; use **View all** for Store Orders. |
| **Active Shift & Cash** | Check the cashier, start time, opening money, cash collected, cash paid out, and expected cash. |
| **Critical Stock Alerts** | Find low-stock items. Use **View Catalog** to check or correct their stock. |

For example, **3,000 + 160 − 670 = 2,490 BDT**. That is starting cash plus recorded shift cash, less the advances shown.

A shop's total sales and one cashier's drawer do not have to match. Other sales can be outside that shift, and phone or bank payments are not cash in the drawer.

**Remember:** Count the real cash when checking the drawer. “Sales minus expenses” is not the same as physical cash or final profit.

## 8. Staff — manage cashier accounts

**Open:** Left menu → **Staff**. Page heading: **Staff & Cashier Accounts**.

### Create a cashier

1. Click **Create cashier**.
2. Enter **Full name**.
3. Add **Email** and **Phone** if available. Both are optional in this form.
4. Select the correct **Branch**.
5. Enter **Monthly salary (BDT)**.
6. Set a **Password** with at least eight characters.
7. Click **Confirm**.
8. Find the new cashier. Give that person their displayed cashier ID and password privately.

The cashier signs in using **Terminal Public ID**, not your Admin email. The ID is shown below the cashier's name.

**Remember:** Check branch and salary before saving. Do not let staff share one cashier account.

### Find or edit a cashier

Search by name, public ID, or phone. Use **All statuses** to show active or suspended accounts.

Click **…** → **Edit account**. Change the name, phone, branch, or salary shown in the form. **Reset password (optional)** is only for setting a new password; leave it empty to keep the current one. Click **Confirm**.

### Stop or allow account access

Click **…** → **Suspend account** to stop access, or **Activate account** to allow it again. Add an **Audit reason** if useful, then **Confirm**.

“Suspended” means the account is stopped. It does not mean salary was paid or cancelled.

### Remove a cashier

Click **…** → **Delete**, read the message, then **Confirm** only when appropriate.

**Remember:** A cashier with an open shift cannot be deleted through this flow. Do not delete an account to hide a wrong sale; check that sale instead.

## 9. Payroll — salary and advances

**Open:** Left menu → **Payroll**. Page heading: **Payroll & Advances**.

An **advance** is salary money taken early. **Payroll** is the monthly salary record.

### Check this month's salary

1. Check the business and branch.
2. Choose the **month** and **year** at the top.
3. Open the **Payroll** tab.
4. Check each person's base salary, advance amount, net payable, and status.

| Screen word | Simple meaning |
|---|---|
| **Base compensation / Base salary** | Salary before taking away the advance amount. |
| **Advance Ledger** in the salary table | The advance deduction shown for that salary calculation. |
| **Net payable** | Salary money left to pay after the deduction. |
| **Total net payable** | The shown net amounts for all listed staff, including paid rows. |
| **Outstanding unpaid** | The amount still unpaid. This is the useful number before paying the rest. |
| **DUE** | Not yet marked paid for this salary month. |
| **PAID / Disbursed** | This salary is already recorded as paid. |

**Example:** Base salary 25,000 BDT − advance deduction 670 BDT = **24,330 BDT** left to pay.

For example, one person's 35,000 BDT is already paid. If the total net amount is 59,330 BDT, only **24,330 BDT** is still unpaid. Do not pay the full total again.

### Record salary for one person

1. Check the month and the person's row.
2. Check **Net payable** and that the row is **DUE**.
3. Click **Process** only when you intend to record that salary as paid.
4. Wait for the row to show **PAID** and its paid date.

**Process** submits the action directly in the current page. Do not expect an extra confirmation box before that click.

### Record salary for the remaining staff together

1. Check the month, branch, and **Outstanding unpaid** amount.
2. Click **Batch Disburse Payroll**.
3. Check the amount and the number of unpaid staff in the box.
4. Click **Confirm Batch Disbursement** once.
5. Wait for the salary list to update.

“Disburse” here means record salary as paid. This form is not a bank-transfer screen. Make sure the real salary payment is handled correctly by the shop.

**Remember:** Check the month, people, and amount before paying. If a salary result is unclear, check its status before trying again.

### Read the Advances tab

Open **Advances** to see salary money taken early for the selected view.

| Column or status | Meaning |
|---|---|
| **Amount** | The original advance. |
| **Deducted** | The part already taken away from salary. |
| **Remaining** | The part still to be taken away from later salary. |
| **PENDING** | Some or all of the advance still needs a salary deduction. It is not an approval request. |
| **DEDUCTED** | The advance has been fully taken away from salary. |
| **DELETED** | The advance was cancelled in the records. Keep its history in mind. |

The cashier records their own advance under **Shifts**. Admin uses this page to check advances; there is no Admin advance-create button here.

If an advance is bigger than one month's salary, the unpaid part can remain for later salary. For example, 25,000 BDT of advances against 20,000 BDT salary can leave **0 BDT** to pay now and **5,000 BDT** still to deduct later. Check **Deducted** and **Remaining**, not only the status badge.

### Cancel a wrong advance record

1. Find the exact record in **Advances**.
2. Click **Void** if the button is shown.
3. Read the message, then click **Confirm Void Advance**.
4. Check the changed status and totals.

**Remember:** Void means cancel the record; it does not put real cash back in the drawer. Advances already used in a salary deduction cannot be cancelled this way.

## 10. Expenses — record shop spending

**Open:** Left menu → **Expenses**. Page heading: **Operational Expenses**.

An **expense** is money the shop spends, such as rent, delivery, repairs, or salary paid.

### Add an expense

1. Check the branch. Click **Record Expense**.
2. Enter a clear **Title**, such as “November shop rent”.
3. Enter **Amount (BDT)**.
4. Choose **Category**. Use the right group, such as **Rent & Facilities** or **Delivery & Transport**.
5. Add **Note / Description** if useful. Example: “Paid by bank transfer”.
6. Click **Save Expense Entry**.
7. Check the new row and **Incurred Date**, which is the recorded expense date.

This form does not have a separate payment-method selector or a past-date picker. A note helps explain the payment; it is not a separate money transfer.

### Find and read expenses

Choose **Category**, **Expense Type**, and **Period (Month / Year)**. Use **Keyword Search** for a title or note.

**Manual Expenses** are entries added through the expense form. **Payroll Disbursements** are salary payments added by payroll. **Top spending category** shows the largest spending group in the summary.

Some summary numbers can cover a wider set than the searched rows. Check the month and type before comparing them.

### Change or delete an expense

For a manual expense, use the pencil, change the details, and click **Save Changes**.

Use the bin to open **Confirm Delete Expense**. Click **Delete** only for a wrong entry. It is removed from the active expense totals.

A payroll row says **System Managed**. You cannot edit or delete it as an ordinary expense.

**Remember:** Do not add the same salary again as a manual expense. Salary advances stay in the Advances list; they are not a new expense entry here.

## 11. Reports — check sales over time

**Open:** Left menu → **Reports**. Page heading: **Sales Analytics & Reports**.

### Choose what to see

1. Choose **Today**, **Yesterday**, **Daily**, **Weekly**, **Monthly**, **Quarterly**, or **Year**. “Quarterly” means a three-month period.
2. Choose a branch, or **All Locations** for the current business.
3. Use the month, week, and year boxes where needed.
4. Read the totals and the sales below.
5. Use **Reset filters** to return to the page's starting choices when you get lost.

| Part | Simple meaning |
|---|---|
| **Gross sales** | The sales total shown by the report. It is not profit or cash counted by hand. |
| **Average ticket** | The average amount per sale in the report. |
| **Orders** | Number of sales in the report. |
| **Gross margin (Admin)** | A percentage comparing sales with recorded item costs. It is not final profit after all shop spending. |
| **Category performance** | How the item groups are doing. |
| **Payment breakdown** | How much is recorded under each payment method. |
| **Transactions** | The detailed rows for the chosen view. |

Use the Transactions search for an invoice, customer, or cashier. Use **View All Orders** to open the full order page.

### Save a report

Set the needed filters, then click **Export CSV** or **Export PDF**. CSV is a file you can open in a spreadsheet. PDF is a report file for viewing or printing.

**Remember:** Check the business, locations, and dates before sharing a report. Sales, stock value, cash in a drawer, and profit are different numbers.

## 12. Audit Logs — see who did what

**Open:** Left menu → **Audit Logs**. Page heading: **Audit Logs & Governance**.

This page helps you check saved actions, such as a stock change, refund, salary change, or staff change. It is a history page, not a page for making those changes.

1. Click **Refresh Activity** to load the latest saved activity.
2. Choose **All Actions & Events** to narrow the kind of action.
3. Choose **All Entity Types** for the kind of item changed, such as a product, staff member, or order.
4. Choose a branch if needed.
5. Click **Filter by Date** and set **From Date (Dhaka)** and **To Date (Dhaka)**.
6. Use **Search this page** to find words on the loaded page. Use the page arrows to check more results.
7. Click **Inspect** on a row. Read **Event Summary**, **Performed By**, and the details shown.
8. Close the box when done. Use **Reset Filters** to start again.

**Inspect** means “open the details”. It does not change the record.

The stock, staff, and money-action counts can describe the current page or filtered view. Read the small text below each number.

**Remember:** Do not repeat a stock change or refund just because you are reading its old log. The action may already be complete.

## 13. When you need help

### The list is empty

Check the business and branch first. Clear search text and reset the relevant filters. Check the date or month. If a loading error is shown, click **Retry**.

### My product is missing from the selling screen

Check the branch and category filter. Open **Catalog** and check that the product has a variant. Use **Resume setup** or **Add Variant** when shown. A product name alone cannot be added to a sale.

### The price changed while I was selling

Read the message. Check the new price and the ticket total with the customer. Check the cash amount again before **Complete sale**.

### I clicked Save or Pay, but the result is unclear

A slow or lost internet reply does not prove the action failed.

1. Stop. Do not start the same sale, refund, or salary action as a new one.
2. Check the matching saved record: **Store Orders**, **Payroll**, or the relevant history.
3. If the app offers **Retry exact ticket**, **Retry completion**, **Retry same sale**, or **Retry uncertain refund**, use that saved action without changing its details.
4. If you still cannot tell what happened, contact the person who manages the app and give the bill number, time, and amount.

**Reconciled (Clear)** and **I checked history (Clear lock)** remove a warning lock. They do not refund or undo anything. Use them only after the saved result has been checked and you know the next step. An empty or still-loading list alone is not enough.

### I entered the wrong customer or amount on a saved sale

Open **Store Orders** and check the bill. This page does not provide a general “edit paid sale” button. Use the correct refund process when needed, or ask for help. Do not create a second sale just to make the screen look right.

### The app will not delete something

Read the message. The item may be linked to stock, sales, an open shift, or other saved records. Keep the history and ask for help rather than deleting related records one by one.

### Internet is not working

Restore the connection before continuing. Do not treat an unsaved ticket or a held ticket as a paid sale.

## 14. Simple word guide

| Word on screen | Meaning |
|---|---|
| **BDT** | Taka. |
| **Branch / Location** | One shop place. |
| **Category** | A group of items. |
| **Variant** | One exact kind, size, or colour of a product. |
| **SKU** | A short code used to find an item. |
| **Stock / Inventory** | The recorded number of items in the shop. |
| **Ticket / Order** | A sale's item list. A ticket being prepared is not paid yet. |
| **Invoice / Receipt** | The bill number / the saved bill you can print. |
| **Quantity** | How many. |
| **Subtotal / Total** | The item-list amount / the amount for the sale shown. |
| **Change** | Cash to give back to the customer. |
| **Refund** | Record money returned for a saved sale. |
| **Advance** | Salary money taken early. |
| **Deducted** | Already taken away from salary. |
| **Remaining / Outstanding** | The amount still left. |
| **Disburse / Process payroll** | Record salary as paid. |
| **Void** | Cancel a record through the shown action. |
| **Opening float** | Cash put in the drawer at the start. |
| **Expected cash** | The amount the app expects from its recorded shift activity. |
| **Variance** | The difference between counted cash and expected cash. |
| **Audit log** | A saved record of who did something. |
| **Inspect** | Open the details. |
| **Optional** | You may leave this box empty. |

<!--
SOURCE MAP / CONTENT BOUNDARIES — NOT FOR DISPLAY
All paths below are relative to src/ in frontend some part.zip.
Navigation: components/layout/sidebar.tsx; components/layout/navbar.tsx; components/common/data-pagination.tsx.
Login/reset: features/auth/components/login-form.tsx; app/(auth)/forgot-password/page.tsx; app/(auth)/reset-password/page.tsx.
Business: features/tenant/components/business-branch-hub.tsx.
Catalog: features/catalog/components/catalog-manager.tsx. Actual two-stage product save and separate variant rows are documented; do not replace them with an imagined atomic product form or variant selector.
Sales: features/pos/components/{terminal-workspace,custom-sale-view,orders-workspace,receipt-dialog}.tsx; lib/payment-methods.ts.
Admin overview: app/(dashboard)/admin/dashboard/page.tsx.
Staff/payroll: features/hr/components/{staff-manager,payroll-manager}.tsx; features/hr/api/use-hr.ts. These payroll/advance hooks include selected branch context. Single Process submits directly. Pending advances are not approval requests.
Expenses: features/expenses/components/expenses-manager.tsx. Create form has no date or payment-method picker. Summary and search filters are not identical; do not promise that every KPI equals the visible table.
Reports: features/reports/components/reports-dashboard.tsx. Filters include All Locations for the selected business.
Audit: features/audit/components/{audit-logs-view,audit-filter-toolbar,audit-detail-modal,audit-stat-cards}.tsx. Text search is current-page search, not a guaranteed search of all history.
Screenshots establish current labels and appearance, not proof of backend calculation correctness. In particular the dashboard's "Today's Live Receipts" includes older dated rows in the supplied screenshot; the guide tells readers to check dates, not that every row is today.
No new permission, payroll approval, refund-payment selector, automated bank transfer, customer CRM/loyalty system, offline selling, or Admin shift-management screen is promised.
Before publishing, check help links and labels against the working app. Hide these comments. Design is a later task. Source was read to write content; build, backend checks, and browser tests were not run for this documentation task.
-->
