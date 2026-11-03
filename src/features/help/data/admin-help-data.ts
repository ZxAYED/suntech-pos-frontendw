// Derived mechanically from docs/SunTech_Admin_Help_Content.md
// Editorial source: docs/SunTech_Admin_Help_Content.md
// Finished user-facing content. HTML comments are excluded.
import type { HelpGuideData } from "../types";

export const adminHelpData: HelpGuideData = {
  "role": "admin",
  "title": "Help — Admin",
  "sourceDoc": "docs/SunTech_Admin_Help_Content.md",
  "intro": {
    "paragraphs": [
      "Use this guide when you need help with your shop.",
      "Find the page name below. Follow the steps in order. The words in **bold** are the words to look for on the screen."
    ],
    "workflowText": "**Start here:** Choose your business and branch → Add a category → Add a product → Add a variant → Sell the item."
  },
  "quickLinks": [
    {
      "want": "Sign in or use the buttons",
      "label": "Start here",
      "topicId": "1-start-here"
    },
    {
      "want": "Choose or add a shop",
      "label": "Business and branch",
      "topicId": "2-business-and-branch"
    },
    {
      "want": "Add items, prices, stock, or photos",
      "label": "Catalog",
      "topicId": "3-catalog--add-and-manage-items"
    },
    {
      "want": "Sell an item already on the screen",
      "label": "Catalog Register",
      "topicId": "4-catalog-register--sell-a-saved-item"
    },
    {
      "want": "Sell a service or an item not in the list",
      "label": "Quick Custom Sale",
      "topicId": "5-quick-custom-sale--type-an-item-and-sell-it"
    },
    {
      "want": "Find a sale, print a bill, or give money back",
      "label": "Store Orders",
      "topicId": "6-store-orders--find-a-sale-print-or-refund"
    },
    {
      "want": "Check the shop's sales and cash",
      "label": "Dashboard",
      "topicId": "7-dashboard--check-the-shop"
    },
    {
      "want": "Add or manage a cashier",
      "label": "Staff",
      "topicId": "8-staff--manage-cashier-accounts"
    },
    {
      "want": "Pay salary or check salary advances",
      "label": "Payroll",
      "topicId": "9-payroll--salary-and-advances"
    },
    {
      "want": "Record shop spending",
      "label": "Expenses",
      "topicId": "10-expenses--record-shop-spending"
    },
    {
      "want": "Check or download sales reports",
      "label": "Reports",
      "topicId": "11-reports--check-sales-over-time"
    },
    {
      "want": "See who changed something",
      "label": "Audit Logs",
      "topicId": "12-audit-logs--see-who-did-what"
    },
    {
      "want": "Fix a common problem",
      "label": "When you need help",
      "topicId": "13-when-you-need-help"
    },
    {
      "want": "Understand a word on the screen",
      "label": "Simple word guide",
      "topicId": "14-simple-word-guide"
    }
  ],
  "topics": [
    {
      "id": "1-start-here",
      "number": 1,
      "title": "Start here",
      "fullTitle": "1. Start here",
      "blocks": [
        {
          "type": "heading",
          "level": 3,
          "text": "Sign in"
        },
        {
          "type": "steps",
          "items": [
            "Open the sign-in page and choose **Admin**.",
            "Type your **Admin Email** and **Password**.",
            "Click **Sign in as Admin**.",
            "Check the business and branch shown on the left before you work."
          ]
        },
        {
          "type": "remember",
          "text": "Use your own account. Do not give your Admin password to a cashier."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Forgot your password?"
        },
        {
          "type": "steps",
          "items": [
            "On the Admin sign-in form, click **Forgot password?**",
            "Enter your **Administrator Email**. Click **Send recovery code**.",
            "Check that email account for the six-digit code.",
            "On the reset page, enter the email, **6-Digit Reset Code**, and **New Password**.",
            "Click **Verify code and update password**. Then **Return to sign in**."
          ]
        },
        {
          "type": "remember",
          "text": "Never give your password or recovery code to another person. Check the spam folder if the email is missing."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Buttons you will use often"
        },
        {
          "type": "table",
          "headers": [
            "Button or picture",
            "What it does"
          ],
          "rows": [
            [
              "**Save**, **Confirm**, or a blue action button",
              "Does the action named on that form. Check the details first."
            ],
            [
              "**Cancel**",
              "Closes the form without submitting that form. It does not undo an earlier save."
            ],
            [
              "**×** at the top of a box",
              "Closes the box."
            ],
            [
              "Pencil picture",
              "Opens an item so you can change it."
            ],
            [
              "Bin picture",
              "Starts removing an item. Read any message before you confirm."
            ],
            [
              "**…**",
              "Opens more actions for that row."
            ],
            [
              "**Retry** on a loading error",
              "Tries to load that list again. A payment retry has special steps; see part 13."
            ],
            [
              "**Rows**",
              "Chooses how many lines to show on one page. It does not add or remove records."
            ],
            [
              "**> / Next page**",
              "Shows the next page of results. It does not save anything."
            ],
            [
              "**< / Previous page**",
              "Returns to the previous page."
            ],
            [
              "**>> / Last page**, **<< / First page**",
              "Goes to the last or first page of results."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "For money boxes, type whole taka, such as **500**. For quantity or stock, type the number of items. A grey button may not be ready to use. You may need to fill a box, select an item, or wait for the page to finish. On a small screen, use the menu button at the top to open the left menu. A wide table may need to be moved sideways to see **Actions**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Sign out"
        },
        {
          "type": "paragraph",
          "text": "Click **Sign out** in the left menu, or the exit picture near your name at the top."
        },
        {
          "type": "remember",
          "text": "Finish or check any waiting sale before you sign out. Sign out when another person will use the computer."
        }
      ],
      "searchIndex": "1. Start here Sign in Open the sign-in page and choose Admin. Type your Admin Email and Password. Click Sign in as Admin. Check the business and branch shown on the left before you work. Remember Use your own account. Do not give your Admin password to a cashier. Forgot your password? On the Admin sign-in form, click Forgot password? Enter your Administrator Email. Click Send recovery code. Check that email account for the six-digit code. On the reset page, enter the email, 6-Digit Reset Code, and New Password. Click Verify code and update password. Then Return to sign in. Remember Never give your password or recovery code to another person. Check the spam folder if the email is missing. Buttons you will use often Button or picture What it does Save, Confirm, or a blue action button Does the action named on that form. Check the details first. Cancel Closes the form without submitting that form. It does not undo an earlier save. × at the top of a box Closes the box. Pencil picture Opens an item so you can change it. Bin picture Starts removing an item. Read any message before you confirm. … Opens more actions for that row. Retry on a loading error Tries to load that list again. A payment retry has special steps; see part 13. Rows Chooses how many lines to show on one page. It does not add or remove records. > / Next page Shows the next page of results. It does not save anything. < / Previous page Returns to the previous page. >> / Last page, << / First page Goes to the last or first page of results. For money boxes, type whole taka, such as 500. For quantity or stock, type the number of items. A grey button may not be ready to use. You may need to fill a box, select an item, or wait for the page to finish. On a small screen, use the menu button at the top to open the left menu. A wide table may need to be moved sideways to see Actions. Sign out Click Sign out in the left menu, or the exit picture near your name at the top. Remember Finish or check any waiting sale before you sign out. Sign out when another person will use the computer."
    },
    {
      "id": "2-business-and-branch",
      "number": 2,
      "title": "Business and branch",
      "fullTitle": "2. Business and branch",
      "blocks": [
        {
          "type": "callout",
          "label": "Page:",
          "text": "Business & Branch Selection. Open it with **Switch** beside the branch name."
        },
        {
          "type": "paragraph",
          "text": "A **business** is your shop business. A **branch** is one shop location. One business can have more than one branch."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Choose where you will work"
        },
        {
          "type": "steps",
          "items": [
            "Click **Switch**.",
            "Open **01. Business Selection**.",
            "Find the business and click **Select Business**. For the current business, click **View Branches**.",
            "In **02. Branch Location**, find the branch and click **Select Branch**.",
            "The app opens **Catalog Register**. Check the branch name again."
          ]
        },
        {
          "type": "paragraph",
          "text": "The selected business and branch tell the app which shop you are working in. Stock and sales can differ between branches."
        },
        {
          "type": "remember",
          "text": "Do not switch shops during an unfinished sale. If the app says a money action is still unclear, check that action first."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Add a business"
        },
        {
          "type": "steps",
          "items": [
            "Open **01. Business Selection**.",
            "Click **Add Business**.",
            "Enter the business **Name**.",
            "Click **Save**. Find the new business in the list.",
            "Choose it, then add a branch."
          ]
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Add a branch"
        },
        {
          "type": "steps",
          "items": [
            "Choose the business first. Open **02. Branch Location**.",
            "Click **Add Branch**.",
            "Enter the branch **Name**, such as “Uttara Branch”.",
            "Enter the **Address** if available.",
            "Click **Save**, then **Select Branch** to work there."
          ]
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Change or remove a business or branch"
        },
        {
          "type": "paragraph",
          "text": "To change its details, click the pencil beside it, change the name or address shown in the form, and click **Save**. To remove it, click the bin and read the message. Confirm only when you are sure. A message may explain why it cannot be removed."
        },
        {
          "type": "remember",
          "text": "Do not remove a shop just to switch away from it. Use **Switch**. If removal is blocked, do not delete staff or records only to get past the message."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "What the summary boxes mean"
        },
        {
          "type": "paragraph",
          "text": "**Total Businesses** is the number of businesses in your list. **Branches in Business** is the branch count for the chosen business. **Current Active Branch** is the branch you are working in. The current-branch card has **Open Catalog Register** and **Go to Operations Dashboard**. These buttons open those pages; they do not make a sale."
        }
      ],
      "searchIndex": "2. Business and branch Page: Business & Branch Selection. Open it with Switch beside the branch name. A business is your shop business. A branch is one shop location. One business can have more than one branch. Choose where you will work Click Switch. Open 01. Business Selection. Find the business and click Select Business. For the current business, click View Branches. In 02. Branch Location, find the branch and click Select Branch. The app opens Catalog Register. Check the branch name again. The selected business and branch tell the app which shop you are working in. Stock and sales can differ between branches. Remember Do not switch shops during an unfinished sale. If the app says a money action is still unclear, check that action first. Add a business Open 01. Business Selection. Click Add Business. Enter the business Name. Click Save. Find the new business in the list. Choose it, then add a branch. Add a branch Choose the business first. Open 02. Branch Location. Click Add Branch. Enter the branch Name, such as “Uttara Branch”. Enter the Address if available. Click Save, then Select Branch to work there. Change or remove a business or branch To change its details, click the pencil beside it, change the name or address shown in the form, and click Save. To remove it, click the bin and read the message. Confirm only when you are sure. A message may explain why it cannot be removed. Remember Do not remove a shop just to switch away from it. Use Switch. If removal is blocked, do not delete staff or records only to get past the message. What the summary boxes mean Total Businesses is the number of businesses in your list. Branches in Business is the branch count for the chosen business. Current Active Branch is the branch you are working in. The current-branch card has Open Catalog Register and Go to Operations Dashboard. These buttons open those pages; they do not make a sale."
    },
    {
      "id": "3-catalog--add-and-manage-items",
      "number": 3,
      "title": "Catalog — add and manage items",
      "fullTitle": "3. Catalog — add and manage items",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Catalog**."
        },
        {
          "type": "paragraph",
          "text": "This page prepares items for selling. **Catalog Register** is a different page: it is where you sell them."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Understand the three parts"
        },
        {
          "type": "table",
          "headers": [
            "Part",
            "Simple meaning",
            "Example"
          ],
          "rows": [
            [
              "Category",
              "A group of items",
              "Mobile Phones"
            ],
            [
              "Product",
              "The item name",
              "Phone A"
            ],
            [
              "Variant",
              "The exact kind you sell, with its own price and stock",
              "Black / 128 GB"
            ]
          ]
        },
        {
          "type": "callout",
          "label": "Correct order:",
          "text": "Category → Product → First variant."
        },
        {
          "type": "paragraph",
          "text": "Even when there is only one kind, add one variant. You can call it **Default**. A product name alone is not ready to sell."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "A. Create a category"
        },
        {
          "type": "steps",
          "items": [
            "Click **New Category**.",
            "In **Category name**, type a short group name, such as “Mobile Phones”.",
            "Add a **Description** if useful. You may leave it empty.",
            "Click **Create category**."
          ]
        },
        {
          "type": "callout",
          "label": "Result:",
          "text": "You can now choose that category when adding a product."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "B. Create a product"
        },
        {
          "type": "steps",
          "items": [
            "Click **New Product**.",
            "In **Step 1 — product**, enter the **Product name**.",
            "Add a short **Description** if useful.",
            "Choose the correct **Category**. Check it even if one is already selected.",
            "Click **Create & continue**."
          ]
        },
        {
          "type": "callout",
          "label": "Result:",
          "text": "The product is saved. The next box is **Step 2 — first variant**. Continue below; setup is not finished yet."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "C. Add the first variant"
        },
        {
          "type": "paragraph",
          "text": "Fill in the boxes in **Step 2 — first variant**:"
        },
        {
          "type": "table",
          "headers": [
            "Box",
            "What to type"
          ],
          "rows": [
            [
              "**Variant name**",
              "The kind, size, or colour. Example: “Black / 128 GB”. Use “Default” for one kind only."
            ],
            [
              "**SKU (auto if empty)**",
              "Your short item code. You may leave it empty for the app to make a code."
            ],
            [
              "**Barcode**",
              "The item's barcode, if it has one. Otherwise leave it empty."
            ],
            [
              "**Selling price**",
              "The price the customer pays for ONE item, in taka."
            ],
            [
              "**Cost price**",
              "What the shop paid for ONE item, if known. This is not the selling price."
            ],
            [
              "**Stock**",
              "How many of this exact variant are in the selected branch. The box starts at 0."
            ]
          ]
        },
        {
          "type": "steps",
          "items": [
            "Check the price and stock.",
            "Click **Finish product**.",
            "Check the variant in the Catalog table, then find it in **Catalog Register**."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "Add “Phone A”, then “Black / 128 GB”, selling price 20,000 BDT, cost price 18,000 BDT, stock 5. You now have one sellable variant with five units in this branch."
        },
        {
          "type": "remember",
          "text": "Stock belongs to the selected branch. Closing step 2 does not remove the product saved in step 1."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "D. Finish a product you left halfway"
        },
        {
          "type": "paragraph",
          "text": "If a message says a product has no variants, click **Add Variant** beside that product. If **Resume setup** is shown, use it to return to the first-variant form. Enter the variant details and finish the form. Do not create the same product again."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "E. Add another kind of an existing product"
        },
        {
          "type": "steps",
          "items": [
            "Click **New Variant**, or the add-variant button beside the product in the lower **Products** list.",
            "In **Choose product**, choose the existing product if it is not already chosen.",
            "Enter the new variant name, code, prices, and stock.",
            "Click **Add variant**."
          ]
        },
        {
          "type": "paragraph",
          "text": "For example, add “Blue / 256 GB” under “Phone A”. It has separate stock from “Black / 128 GB”."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "F. Find items and read the numbers"
        },
        {
          "type": "paragraph",
          "text": "Use the search box for a product, variant, SKU, or barcode. Use **All categories** to show one category, or return to all categories. Use the arrows and **Rows** below the table to see more items."
        },
        {
          "type": "table",
          "headers": [
            "Number",
            "What it tells you"
          ],
          "rows": [
            [
              "**Products**",
              "Product names in the catalog."
            ],
            [
              "**Units in branch**",
              "The stock count shown for the branch. This is not the number of product names."
            ],
            [
              "**Low stock SKUs**",
              "Variants with a low recorded stock count."
            ],
            [
              "**Inventory value**",
              "The app's value of stock using recorded item costs. It is not money in the cash drawer."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "One product can have several rows because it has several variants. Check the variant name below the product name. The lower **Categories** list also lets you filter by a category. Its arrow shows or hides more details. The lower **Products** list contains product-level actions."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "G. Change names, details, or prices"
        },
        {
          "type": "list",
          "items": [
            "**Category:** Find it in **Categories**, click its pencil, change the details, and click **Save category**.",
            "**Product:** Find it in **Products**, click its pencil, change the details, and click **Save**.",
            "**Variant:** Click the pencil on the variant row. Change the needed fields and click **Save variant**."
          ]
        },
        {
          "type": "remember",
          "text": "Check the correct variant before changing a price or stock. If the app refuses a change because the item has been used, keep the record and ask for help."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "H. Correct the branch stock count"
        },
        {
          "type": "steps",
          "items": [
            "Find the variant row.",
            "Click the small box-with-plus button. Its name is **Set branch stock**.",
            "Enter the **full new stock count** for this branch.",
            "Click **Update stock**."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "The app shows 10. You count 15 in the shop. Enter **15**, not 5. This button replaces the count; it does not add your number to the old count."
        },
        {
          "type": "remember",
          "text": "Check the real items before changing stock. A negative count means the record is below zero; tell the right person and correct it after checking."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "I. Add or change item photos"
        },
        {
          "type": "steps",
          "items": [
            "Find the variant and click its picture button, **Manage images**.",
            "Click **Set profile** to choose its main photo.",
            "Click **Add gallery** to choose extra photos.",
            "Wait for the upload to finish. Check the pictures in the box.",
            "Use **Remove profile** to remove the main photo, or the bin on a gallery photo to remove that photo."
          ]
        },
        {
          "type": "paragraph",
          "text": "Use a clear photo of the correct item. The app accepts JPG, PNG, and WebP pictures."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "J. Remove an item you do not need"
        },
        {
          "type": "paragraph",
          "text": "Use the bin beside the category, product, or variant. Read the name and the removal message before confirming."
        },
        {
          "type": "remember",
          "text": "Removing an item is not the same as refunding a sale. If the app blocks removal because of stock or past use, do not remove other records to force it."
        }
      ],
      "searchIndex": "3. Catalog — add and manage items Open: Left menu → Catalog. This page prepares items for selling. Catalog Register is a different page: it is where you sell them. Understand the three parts Part Simple meaning Example Category A group of items Mobile Phones Product The item name Phone A Variant The exact kind you sell, with its own price and stock Black / 128 GB Correct order: Category → Product → First variant. Even when there is only one kind, add one variant. You can call it Default. A product name alone is not ready to sell. A. Create a category Click New Category. In Category name, type a short group name, such as “Mobile Phones”. Add a Description if useful. You may leave it empty. Click Create category. Result: You can now choose that category when adding a product. B. Create a product Click New Product. In Step 1 — product, enter the Product name. Add a short Description if useful. Choose the correct Category. Check it even if one is already selected. Click Create & continue. Result: The product is saved. The next box is Step 2 — first variant. Continue below; setup is not finished yet. C. Add the first variant Fill in the boxes in Step 2 — first variant: Box What to type Variant name The kind, size, or colour. Example: “Black / 128 GB”. Use “Default” for one kind only. SKU (auto if empty) Your short item code. You may leave it empty for the app to make a code. Barcode The item's barcode, if it has one. Otherwise leave it empty. Selling price The price the customer pays for ONE item, in taka. Cost price What the shop paid for ONE item, if known. This is not the selling price. Stock How many of this exact variant are in the selected branch. The box starts at 0. Check the price and stock. Click Finish product. Check the variant in the Catalog table, then find it in Catalog Register. Example: Add “Phone A”, then “Black / 128 GB”, selling price 20,000 BDT, cost price 18,000 BDT, stock 5. You now have one sellable variant with five units in this branch. Remember Stock belongs to the selected branch. Closing step 2 does not remove the product saved in step 1. D. Finish a product you left halfway If a message says a product has no variants, click Add Variant beside that product. If Resume setup is shown, use it to return to the first-variant form. Enter the variant details and finish the form. Do not create the same product again. E. Add another kind of an existing product Click New Variant, or the add-variant button beside the product in the lower Products list. In Choose product, choose the existing product if it is not already chosen. Enter the new variant name, code, prices, and stock. Click Add variant. For example, add “Blue / 256 GB” under “Phone A”. It has separate stock from “Black / 128 GB”. F. Find items and read the numbers Use the search box for a product, variant, SKU, or barcode. Use All categories to show one category, or return to all categories. Use the arrows and Rows below the table to see more items. Number What it tells you Products Product names in the catalog. Units in branch The stock count shown for the branch. This is not the number of product names. Low stock SKUs Variants with a low recorded stock count. Inventory value The app's value of stock using recorded item costs. It is not money in the cash drawer. One product can have several rows because it has several variants. Check the variant name below the product name. The lower Categories list also lets you filter by a category. Its arrow shows or hides more details. The lower Products list contains product-level actions. G. Change names, details, or prices Category: Find it in Categories, click its pencil, change the details, and click Save category. Product: Find it in Products, click its pencil, change the details, and click Save. Variant: Click the pencil on the variant row. Change the needed fields and click Save variant. Remember Check the correct variant before changing a price or stock. If the app refuses a change because the item has been used, keep the record and ask for help. H. Correct the branch stock count Find the variant row. Click the small box-with-plus button. Its name is Set branch stock. Enter the full new stock count for this branch. Click Update stock. Example: The app shows 10. You count 15 in the shop. Enter 15, not 5. This button replaces the count; it does not add your number to the old count. Remember Check the real items before changing stock. A negative count means the record is below zero; tell the right person and correct it after checking. I. Add or change item photos Find the variant and click its picture button, Manage images. Click Set profile to choose its main photo. Click Add gallery to choose extra photos. Wait for the upload to finish. Check the pictures in the box. Use Remove profile to remove the main photo, or the bin on a gallery photo to remove that photo. Use a clear photo of the correct item. The app accepts JPG, PNG, and WebP pictures. J. Remove an item you do not need Use the bin beside the category, product, or variant. Read the name and the removal message before confirming. Remember Removing an item is not the same as refunding a sale. If the app blocks removal because of stock or past use, do not remove other records to force it."
    },
    {
      "id": "4-catalog-register--sell-a-saved-item",
      "number": 4,
      "title": "Catalog Register — sell a saved item",
      "fullTitle": "4. Catalog Register — sell a saved item",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Catalog Register**. The Admin page says **Catalog Register (Admin Desk)**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Make a sale"
        },
        {
          "type": "steps",
          "items": [
            "Check the branch name at the top.",
            "Find the item using search, the category buttons, or **All categories**. You can search a SKU or barcode too.",
            "Check the variant name and price on the card. Different variants can appear as separate cards.",
            "Click the blue **+** on the correct card. It appears in **Current ticket** on the right.",
            "Use **+** or **−** in the ticket to change the number. Use **×** to remove one line.",
            "Add the other items. Check **Subtotal**.",
            "Click **Add Customer** to enter a name and phone, if the customer agrees. Click **Done** after typing.",
            "Choose how the customer paid.",
            "For cash, enter **Cash Given**, or use **Exact** if the customer gave the exact total.",
            "Check the items, number, total, and payment choice. Click **Complete sale** once.",
            "Wait for the saved sale and receipt. Print or save the receipt if needed."
          ]
        },
        {
          "type": "paragraph",
          "text": "An open shift is not required to make a sale. Do not stop a correct sale only because the screen says **No active shift**. Scroll down for more item cards. You can also click **Scroll down to load more** when shown. If your shop uses a connected barcode scanner, scanning can add a matching item; check the item and quantity in the ticket before paying."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Choose the correct payment"
        },
        {
          "type": "table",
          "headers": [
            "Choice on screen",
            "Use it when…"
          ],
          "rows": [
            [
              "**Cash (COD)**",
              "The customer gives you cash."
            ],
            [
              "**bKash**",
              "You have checked that the bKash payment was received."
            ],
            [
              "**Nagad**",
              "You have checked that the Nagad payment was received."
            ],
            [
              "**Bank / Card**",
              "You have checked the payment through the shop's bank or card process."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Choosing a payment label records the method. It is not proof that a phone or bank payment arrived."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Cash example"
        },
        {
          "type": "paragraph",
          "text": "Two items at 200 BDT each cost **400 BDT**. The customer gives **500 BDT**. Enter **500** in **Cash Given**. **Change** is **100 BDT** to give back. **Exact** fills in 400. Use it only if the customer gives 400."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Customer name and phone"
        },
        {
          "type": "paragraph",
          "text": "Without a name, the sale uses **Walk-in Customer**. This is allowed. A correct name helps you recognise the sale later. The phone can be kept with the sale and receipt. Ask before entering it and check the digits. Future customer-help features may use these details, but this page does not promise messages, rewards, or reminders."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Hold a ticket and return to it"
        },
        {
          "type": "paragraph",
          "text": "Click the pause button, **Hold ticket**, to keep the current item list for later in this browser tab. It appears under **Held in this tab**. This is not a paid sale. Finish or hold the next customer's ticket before opening a held one. Click the held ticket to bring its items back. Recheck customer details and payment before finishing. The bin beside **Current ticket**, **Clear cart**, removes the current unsaved item list. It does not cancel a saved sale."
        },
        {
          "type": "remember",
          "text": "Check the item, amount, payment, and change before **Complete sale**. If the result is unclear or a price-change message appears, follow part 13 instead of making a second sale."
        }
      ],
      "searchIndex": "4. Catalog Register — sell a saved item Open: Left menu → Catalog Register. The Admin page says Catalog Register (Admin Desk). Make a sale Check the branch name at the top. Find the item using search, the category buttons, or All categories. You can search a SKU or barcode too. Check the variant name and price on the card. Different variants can appear as separate cards. Click the blue + on the correct card. It appears in Current ticket on the right. Use + or − in the ticket to change the number. Use × to remove one line. Add the other items. Check Subtotal. Click Add Customer to enter a name and phone, if the customer agrees. Click Done after typing. Choose how the customer paid. For cash, enter Cash Given, or use Exact if the customer gave the exact total. Check the items, number, total, and payment choice. Click Complete sale once. Wait for the saved sale and receipt. Print or save the receipt if needed. An open shift is not required to make a sale. Do not stop a correct sale only because the screen says No active shift. Scroll down for more item cards. You can also click Scroll down to load more when shown. If your shop uses a connected barcode scanner, scanning can add a matching item; check the item and quantity in the ticket before paying. Choose the correct payment Choice on screen Use it when… Cash (COD) The customer gives you cash. bKash You have checked that the bKash payment was received. Nagad You have checked that the Nagad payment was received. Bank / Card You have checked the payment through the shop's bank or card process. Choosing a payment label records the method. It is not proof that a phone or bank payment arrived. Cash example Two items at 200 BDT each cost 400 BDT. The customer gives 500 BDT. Enter 500 in Cash Given. Change is 100 BDT to give back. Exact fills in 400. Use it only if the customer gives 400. Customer name and phone Without a name, the sale uses Walk-in Customer. This is allowed. A correct name helps you recognise the sale later. The phone can be kept with the sale and receipt. Ask before entering it and check the digits. Future customer-help features may use these details, but this page does not promise messages, rewards, or reminders. Hold a ticket and return to it Click the pause button, Hold ticket, to keep the current item list for later in this browser tab. It appears under Held in this tab. This is not a paid sale. Finish or hold the next customer's ticket before opening a held one. Click the held ticket to bring its items back. Recheck customer details and payment before finishing. The bin beside Current ticket, Clear cart, removes the current unsaved item list. It does not cancel a saved sale. Remember Check the item, amount, payment, and change before Complete sale. If the result is unclear or a price-change message appears, follow part 13 instead of making a second sale."
    },
    {
      "id": "5-quick-custom-sale--type-an-item-and-sell-it",
      "number": 5,
      "title": "Quick Custom Sale — type an item and sell it",
      "fullTitle": "5. Quick Custom Sale — type an item and sell it",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Quick Custom Sale**. The Admin heading is **Direct Custom Sale (Admin Desk)**."
        },
        {
          "type": "paragraph",
          "text": "Use this for a service or an item you need to type yourself. It does not add a product to Catalog or reduce catalog stock."
        },
        {
          "type": "steps",
          "items": [
            "Check the branch.",
            "In **Product or service name**, enter a clear name, such as “Screen protector fitting”.",
            "Add **Variant or style** only if useful.",
            "Enter **Unit price (BDT)** for one item and **Quantity**.",
            "Check **Line total**. Use **Add another item** for another line; use the line's bin to remove an extra line.",
            "Add **Customer name** and **Customer phone** if wanted.",
            "Choose **Payment method**.",
            "For cash, enter **Paid amount (BDT)**, or click **Exact** for the exact total received.",
            "Check **Total**, then click **Complete sale** once.",
            "Wait for the receipt."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "Fitting costs 100 BDT each. Quantity 2 gives a line total of 200 BDT."
        },
        {
          "type": "remember",
          "text": "For an item already kept in Catalog, use **Catalog Register** so its stock is updated. Confirm the real payment before saving a custom sale."
        }
      ],
      "searchIndex": "5. Quick Custom Sale — type an item and sell it Open: Left menu → Quick Custom Sale. The Admin heading is Direct Custom Sale (Admin Desk). Use this for a service or an item you need to type yourself. It does not add a product to Catalog or reduce catalog stock. Check the branch. In Product or service name, enter a clear name, such as “Screen protector fitting”. Add Variant or style only if useful. Enter Unit price (BDT) for one item and Quantity. Check Line total. Use Add another item for another line; use the line's bin to remove an extra line. Add Customer name and Customer phone if wanted. Choose Payment method. For cash, enter Paid amount (BDT), or click Exact for the exact total received. Check Total, then click Complete sale once. Wait for the receipt. Example: Fitting costs 100 BDT each. Quantity 2 gives a line total of 200 BDT. Remember For an item already kept in Catalog, use Catalog Register so its stock is updated. Confirm the real payment before saving a custom sale."
    },
    {
      "id": "6-store-orders--find-a-sale-print-or-refund",
      "number": 6,
      "title": "Store Orders — find a sale, print, or refund",
      "fullTitle": "6. Store Orders — find a sale, print, or refund",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Store Orders**. Page heading: **Store Orders & Sales**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Find and check a sale"
        },
        {
          "type": "steps",
          "items": [
            "Search by invoice, customer, or item.",
            "Use **All statuses**, **All payments**, or **All order types** to narrow the list.",
            "Find the row and click **…** → **View details**.",
            "Check its customer, date, seller, branch, payment, items, quantities, and total."
          ]
        },
        {
          "type": "paragraph",
          "text": "An **invoice** is the sale's bill number. Keep that number when asking for help. **Paid** means the sale is recorded as paid. **Refunded** means all eligible items have been refunded. **Partially refunded** means only part has been refunded."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Print or save the bill"
        },
        {
          "type": "steps",
          "items": [
            "In the sale's **…** menu, click **Print receipt**. You can also use it inside **View details**.",
            "In **Order Receipt**, choose **Print (P)** to print, **PDF** for the PDF action, or **TXT** to save a simple text copy.",
            "Follow the print or save window that opens. For a printer, check the printer and paper choice."
          ]
        },
        {
          "type": "paragraph",
          "text": "Printing again does not create another sale. You can close the receipt without undoing the sale."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Give money back for returned items"
        },
        {
          "type": "steps",
          "items": [
            "Find the original sale. Click **…** → **Refund**.",
            "In **Prepare refund**, enter the number being returned for each item. Leave other lines at 0.",
            "Check **Refundable**. It shows how many can still be returned.",
            "Add a **Reason**, such as “Wrong size”, if useful.",
            "Check **Refund total** carefully.",
            "Click **Confirm refund** once. Wait for confirmation and the updated order status."
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "Three items cost 200 BDT each. Returning one item gives a 200 BDT refund, not 600 BDT. The other two remain sold."
        },
        {
          "type": "paragraph",
          "text": "The form does not offer a new payment-method choice. Do not expect it to send money to a bank or phone account for you. Handle the real return of money through the shop's process, once only."
        },
        {
          "type": "remember",
          "text": "Confirm the returned items and money before clicking. A refund that has already been recorded must not be entered again."
        }
      ],
      "searchIndex": "6. Store Orders — find a sale, print, or refund Open: Left menu → Store Orders. Page heading: Store Orders & Sales. Find and check a sale Search by invoice, customer, or item. Use All statuses, All payments, or All order types to narrow the list. Find the row and click … → View details. Check its customer, date, seller, branch, payment, items, quantities, and total. An invoice is the sale's bill number. Keep that number when asking for help. Paid means the sale is recorded as paid. Refunded means all eligible items have been refunded. Partially refunded means only part has been refunded. Print or save the bill In the sale's … menu, click Print receipt. You can also use it inside View details. In Order Receipt, choose Print (P) to print, PDF for the PDF action, or TXT to save a simple text copy. Follow the print or save window that opens. For a printer, check the printer and paper choice. Printing again does not create another sale. You can close the receipt without undoing the sale. Give money back for returned items Find the original sale. Click … → Refund. In Prepare refund, enter the number being returned for each item. Leave other lines at 0. Check Refundable. It shows how many can still be returned. Add a Reason, such as “Wrong size”, if useful. Check Refund total carefully. Click Confirm refund once. Wait for confirmation and the updated order status. Example: Three items cost 200 BDT each. Returning one item gives a 200 BDT refund, not 600 BDT. The other two remain sold. The form does not offer a new payment-method choice. Do not expect it to send money to a bank or phone account for you. Handle the real return of money through the shop's process, once only. Remember Confirm the returned items and money before clicking. A refund that has already been recorded must not be entered again."
    },
    {
      "id": "7-dashboard--check-the-shop",
      "number": 7,
      "title": "Dashboard — check the shop",
      "fullTitle": "7. Dashboard — check the shop",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Dashboard**. Page heading: **Operations Dashboard**."
        },
        {
          "type": "paragraph",
          "text": "Check the selected branch first."
        },
        {
          "type": "table",
          "headers": [
            "Part",
            "How to use it"
          ],
          "rows": [
            [
              "**Today's net sales**",
              "Read the day's sales figure after the refunds included by the report. This is not the cash in the drawer."
            ],
            [
              "**Cash in drawer**",
              "The app's expected cash for the shift shown. It is not a physical cash count."
            ],
            [
              "**Low stock SKUs**",
              "See how many variants need a stock check."
            ],
            [
              "**Today's expenses**",
              "Read expenses recorded for the day."
            ],
            [
              "**Today's Live Receipts**",
              "Review the displayed bills. Check their dates; use **View all** for Store Orders."
            ],
            [
              "**Active Shift & Cash**",
              "Check the cashier, start time, opening money, cash collected, cash paid out, and expected cash."
            ],
            [
              "**Critical Stock Alerts**",
              "Find low-stock items. Use **View Catalog** to check or correct their stock."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "For example, **3,000 + 160 − 670 = 2,490 BDT**. That is starting cash plus recorded shift cash, less the advances shown. A shop's total sales and one cashier's drawer do not have to match. Other sales can be outside that shift, and phone or bank payments are not cash in the drawer."
        },
        {
          "type": "remember",
          "text": "Count the real cash when checking the drawer. “Sales minus expenses” is not the same as physical cash or final profit."
        }
      ],
      "searchIndex": "7. Dashboard — check the shop Open: Left menu → Dashboard. Page heading: Operations Dashboard. Check the selected branch first. Part How to use it Today's net sales Read the day's sales figure after the refunds included by the report. This is not the cash in the drawer. Cash in drawer The app's expected cash for the shift shown. It is not a physical cash count. Low stock SKUs See how many variants need a stock check. Today's expenses Read expenses recorded for the day. Today's Live Receipts Review the displayed bills. Check their dates; use View all for Store Orders. Active Shift & Cash Check the cashier, start time, opening money, cash collected, cash paid out, and expected cash. Critical Stock Alerts Find low-stock items. Use View Catalog to check or correct their stock. For example, 3,000 + 160 − 670 = 2,490 BDT. That is starting cash plus recorded shift cash, less the advances shown. A shop's total sales and one cashier's drawer do not have to match. Other sales can be outside that shift, and phone or bank payments are not cash in the drawer. Remember Count the real cash when checking the drawer. “Sales minus expenses” is not the same as physical cash or final profit."
    },
    {
      "id": "8-staff--manage-cashier-accounts",
      "number": 8,
      "title": "Staff — manage cashier accounts",
      "fullTitle": "8. Staff — manage cashier accounts",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Staff**. Page heading: **Staff & Cashier Accounts**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Create a cashier"
        },
        {
          "type": "steps",
          "items": [
            "Click **Create cashier**.",
            "Enter **Full name**.",
            "Add **Email** and **Phone** if available. Both are optional in this form.",
            "Select the correct **Branch**.",
            "Enter **Monthly salary (BDT)**.",
            "Set a **Password** with at least eight characters.",
            "Click **Confirm**.",
            "Find the new cashier. Give that person their displayed cashier ID and password privately."
          ]
        },
        {
          "type": "paragraph",
          "text": "The cashier signs in using **Terminal Public ID**, not your Admin email. The ID is shown below the cashier's name."
        },
        {
          "type": "remember",
          "text": "Check branch and salary before saving. Do not let staff share one cashier account."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Find or edit a cashier"
        },
        {
          "type": "paragraph",
          "text": "Search by name, public ID, or phone. Use **All statuses** to show active or suspended accounts. Click **…** → **Edit account**. Change the name, phone, branch, or salary shown in the form. **Reset password (optional)** is only for setting a new password; leave it empty to keep the current one. Click **Confirm**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Stop or allow account access"
        },
        {
          "type": "paragraph",
          "text": "Click **…** → **Suspend account** to stop access, or **Activate account** to allow it again. Add an **Audit reason** if useful, then **Confirm**. “Suspended” means the account is stopped. It does not mean salary was paid or cancelled."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Remove a cashier"
        },
        {
          "type": "paragraph",
          "text": "Click **…** → **Delete**, read the message, then **Confirm** only when appropriate."
        },
        {
          "type": "remember",
          "text": "A cashier with an open shift cannot be deleted through this flow. Do not delete an account to hide a wrong sale; check that sale instead."
        }
      ],
      "searchIndex": "8. Staff — manage cashier accounts Open: Left menu → Staff. Page heading: Staff & Cashier Accounts. Create a cashier Click Create cashier. Enter Full name. Add Email and Phone if available. Both are optional in this form. Select the correct Branch. Enter Monthly salary (BDT). Set a Password with at least eight characters. Click Confirm. Find the new cashier. Give that person their displayed cashier ID and password privately. The cashier signs in using Terminal Public ID, not your Admin email. The ID is shown below the cashier's name. Remember Check branch and salary before saving. Do not let staff share one cashier account. Find or edit a cashier Search by name, public ID, or phone. Use All statuses to show active or suspended accounts. Click … → Edit account. Change the name, phone, branch, or salary shown in the form. Reset password (optional) is only for setting a new password; leave it empty to keep the current one. Click Confirm. Stop or allow account access Click … → Suspend account to stop access, or Activate account to allow it again. Add an Audit reason if useful, then Confirm. “Suspended” means the account is stopped. It does not mean salary was paid or cancelled. Remove a cashier Click … → Delete, read the message, then Confirm only when appropriate. Remember A cashier with an open shift cannot be deleted through this flow. Do not delete an account to hide a wrong sale; check that sale instead."
    },
    {
      "id": "9-payroll--salary-and-advances",
      "number": 9,
      "title": "Payroll — salary and advances",
      "fullTitle": "9. Payroll — salary and advances",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Payroll**. Page heading: **Payroll & Advances**."
        },
        {
          "type": "paragraph",
          "text": "An **advance** is salary money taken early. **Payroll** is the monthly salary record."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Check this month's salary"
        },
        {
          "type": "steps",
          "items": [
            "Check the business and branch.",
            "Choose the **month** and **year** at the top.",
            "Open the **Payroll** tab.",
            "Check each person's base salary, advance amount, net payable, and status."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Screen word",
            "Simple meaning"
          ],
          "rows": [
            [
              "**Base compensation / Base salary**",
              "Salary before taking away the advance amount."
            ],
            [
              "**Advance Ledger** in the salary table",
              "The advance deduction shown for that salary calculation."
            ],
            [
              "**Net payable**",
              "Salary money left to pay after the deduction."
            ],
            [
              "**Total net payable**",
              "The shown net amounts for all listed staff, including paid rows."
            ],
            [
              "**Outstanding unpaid**",
              "The amount still unpaid. This is the useful number before paying the rest."
            ],
            [
              "**DUE**",
              "Not yet marked paid for this salary month."
            ],
            [
              "**PAID / Disbursed**",
              "This salary is already recorded as paid."
            ]
          ]
        },
        {
          "type": "example",
          "label": "Example:",
          "text": "Base salary 25,000 BDT − advance deduction 670 BDT = **24,330 BDT** left to pay."
        },
        {
          "type": "paragraph",
          "text": "For example, one person's 35,000 BDT is already paid. If the total net amount is 59,330 BDT, only **24,330 BDT** is still unpaid. Do not pay the full total again."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Record salary for one person"
        },
        {
          "type": "steps",
          "items": [
            "Check the month and the person's row.",
            "Check **Net payable** and that the row is **DUE**.",
            "Click **Process** only when you intend to record that salary as paid.",
            "Wait for the row to show **PAID** and its paid date."
          ]
        },
        {
          "type": "paragraph",
          "text": "**Process** submits the action directly in the current page. Do not expect an extra confirmation box before that click."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Record salary for the remaining staff together"
        },
        {
          "type": "steps",
          "items": [
            "Check the month, branch, and **Outstanding unpaid** amount.",
            "Click **Batch Disburse Payroll**.",
            "Check the amount and the number of unpaid staff in the box.",
            "Click **Confirm Batch Disbursement** once.",
            "Wait for the salary list to update."
          ]
        },
        {
          "type": "paragraph",
          "text": "“Disburse” here means record salary as paid. This form is not a bank-transfer screen. Make sure the real salary payment is handled correctly by the shop."
        },
        {
          "type": "remember",
          "text": "Check the month, people, and amount before paying. If a salary result is unclear, check its status before trying again."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Read the Advances tab"
        },
        {
          "type": "paragraph",
          "text": "Open **Advances** to see salary money taken early for the selected view."
        },
        {
          "type": "table",
          "headers": [
            "Column or status",
            "Meaning"
          ],
          "rows": [
            [
              "**Amount**",
              "The original advance."
            ],
            [
              "**Deducted**",
              "The part already taken away from salary."
            ],
            [
              "**Remaining**",
              "The part still to be taken away from later salary."
            ],
            [
              "**PENDING**",
              "Some or all of the advance still needs a salary deduction. It is not an approval request."
            ],
            [
              "**DEDUCTED**",
              "The advance has been fully taken away from salary."
            ],
            [
              "**DELETED**",
              "The advance was cancelled in the records. Keep its history in mind."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "The cashier records their own advance under **Shifts**. Admin uses this page to check advances; there is no Admin advance-create button here. If an advance is bigger than one month's salary, the unpaid part can remain for later salary. For example, 25,000 BDT of advances against 20,000 BDT salary can leave **0 BDT** to pay now and **5,000 BDT** still to deduct later. Check **Deducted** and **Remaining**, not only the status badge."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Cancel a wrong advance record"
        },
        {
          "type": "steps",
          "items": [
            "Find the exact record in **Advances**.",
            "Click **Void** if the button is shown.",
            "Read the message, then click **Confirm Void Advance**.",
            "Check the changed status and totals."
          ]
        },
        {
          "type": "remember",
          "text": "Void means cancel the record; it does not put real cash back in the drawer. Advances already used in a salary deduction cannot be cancelled this way."
        }
      ],
      "searchIndex": "9. Payroll — salary and advances Open: Left menu → Payroll. Page heading: Payroll & Advances. An advance is salary money taken early. Payroll is the monthly salary record. Check this month's salary Check the business and branch. Choose the month and year at the top. Open the Payroll tab. Check each person's base salary, advance amount, net payable, and status. Screen word Simple meaning Base compensation / Base salary Salary before taking away the advance amount. Advance Ledger in the salary table The advance deduction shown for that salary calculation. Net payable Salary money left to pay after the deduction. Total net payable The shown net amounts for all listed staff, including paid rows. Outstanding unpaid The amount still unpaid. This is the useful number before paying the rest. DUE Not yet marked paid for this salary month. PAID / Disbursed This salary is already recorded as paid. Example: Base salary 25,000 BDT − advance deduction 670 BDT = 24,330 BDT left to pay. For example, one person's 35,000 BDT is already paid. If the total net amount is 59,330 BDT, only 24,330 BDT is still unpaid. Do not pay the full total again. Record salary for one person Check the month and the person's row. Check Net payable and that the row is DUE. Click Process only when you intend to record that salary as paid. Wait for the row to show PAID and its paid date. Process submits the action directly in the current page. Do not expect an extra confirmation box before that click. Record salary for the remaining staff together Check the month, branch, and Outstanding unpaid amount. Click Batch Disburse Payroll. Check the amount and the number of unpaid staff in the box. Click Confirm Batch Disbursement once. Wait for the salary list to update. “Disburse” here means record salary as paid. This form is not a bank-transfer screen. Make sure the real salary payment is handled correctly by the shop. Remember Check the month, people, and amount before paying. If a salary result is unclear, check its status before trying again. Read the Advances tab Open Advances to see salary money taken early for the selected view. Column or status Meaning Amount The original advance. Deducted The part already taken away from salary. Remaining The part still to be taken away from later salary. PENDING Some or all of the advance still needs a salary deduction. It is not an approval request. DEDUCTED The advance has been fully taken away from salary. DELETED The advance was cancelled in the records. Keep its history in mind. The cashier records their own advance under Shifts. Admin uses this page to check advances; there is no Admin advance-create button here. If an advance is bigger than one month's salary, the unpaid part can remain for later salary. For example, 25,000 BDT of advances against 20,000 BDT salary can leave 0 BDT to pay now and 5,000 BDT still to deduct later. Check Deducted and Remaining, not only the status badge. Cancel a wrong advance record Find the exact record in Advances. Click Void if the button is shown. Read the message, then click Confirm Void Advance. Check the changed status and totals. Remember Void means cancel the record; it does not put real cash back in the drawer. Advances already used in a salary deduction cannot be cancelled this way."
    },
    {
      "id": "10-expenses--record-shop-spending",
      "number": 10,
      "title": "Expenses — record shop spending",
      "fullTitle": "10. Expenses — record shop spending",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Expenses**. Page heading: **Operational Expenses**."
        },
        {
          "type": "paragraph",
          "text": "An **expense** is money the shop spends, such as rent, delivery, repairs, or salary paid."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Add an expense"
        },
        {
          "type": "steps",
          "items": [
            "Check the branch. Click **Record Expense**.",
            "Enter a clear **Title**, such as “November shop rent”.",
            "Enter **Amount (BDT)**.",
            "Choose **Category**. Use the right group, such as **Rent & Facilities** or **Delivery & Transport**.",
            "Add **Note / Description** if useful. Example: “Paid by bank transfer”.",
            "Click **Save Expense Entry**.",
            "Check the new row and **Incurred Date**, which is the recorded expense date."
          ]
        },
        {
          "type": "paragraph",
          "text": "This form does not have a separate payment-method selector or a past-date picker. A note helps explain the payment; it is not a separate money transfer."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Find and read expenses"
        },
        {
          "type": "paragraph",
          "text": "Choose **Category**, **Expense Type**, and **Period (Month / Year)**. Use **Keyword Search** for a title or note. **Manual Expenses** are entries added through the expense form. **Payroll Disbursements** are salary payments added by payroll. **Top spending category** shows the largest spending group in the summary. Some summary numbers can cover a wider set than the searched rows. Check the month and type before comparing them."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Change or delete an expense"
        },
        {
          "type": "paragraph",
          "text": "For a manual expense, use the pencil, change the details, and click **Save Changes**. Use the bin to open **Confirm Delete Expense**. Click **Delete** only for a wrong entry. It is removed from the active expense totals. A payroll row says **System Managed**. You cannot edit or delete it as an ordinary expense."
        },
        {
          "type": "remember",
          "text": "Do not add the same salary again as a manual expense. Salary advances stay in the Advances list; they are not a new expense entry here."
        }
      ],
      "searchIndex": "10. Expenses — record shop spending Open: Left menu → Expenses. Page heading: Operational Expenses. An expense is money the shop spends, such as rent, delivery, repairs, or salary paid. Add an expense Check the branch. Click Record Expense. Enter a clear Title, such as “November shop rent”. Enter Amount (BDT). Choose Category. Use the right group, such as Rent & Facilities or Delivery & Transport. Add Note / Description if useful. Example: “Paid by bank transfer”. Click Save Expense Entry. Check the new row and Incurred Date, which is the recorded expense date. This form does not have a separate payment-method selector or a past-date picker. A note helps explain the payment; it is not a separate money transfer. Find and read expenses Choose Category, Expense Type, and Period (Month / Year). Use Keyword Search for a title or note. Manual Expenses are entries added through the expense form. Payroll Disbursements are salary payments added by payroll. Top spending category shows the largest spending group in the summary. Some summary numbers can cover a wider set than the searched rows. Check the month and type before comparing them. Change or delete an expense For a manual expense, use the pencil, change the details, and click Save Changes. Use the bin to open Confirm Delete Expense. Click Delete only for a wrong entry. It is removed from the active expense totals. A payroll row says System Managed. You cannot edit or delete it as an ordinary expense. Remember Do not add the same salary again as a manual expense. Salary advances stay in the Advances list; they are not a new expense entry here."
    },
    {
      "id": "11-reports--check-sales-over-time",
      "number": 11,
      "title": "Reports — check sales over time",
      "fullTitle": "11. Reports — check sales over time",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Reports**. Page heading: **Sales Analytics & Reports**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Choose what to see"
        },
        {
          "type": "steps",
          "items": [
            "Choose **Today**, **Yesterday**, **Daily**, **Weekly**, **Monthly**, **Quarterly**, or **Year**. “Quarterly” means a three-month period.",
            "Choose a branch, or **All Locations** for the current business.",
            "Use the month, week, and year boxes where needed.",
            "Read the totals and the sales below.",
            "Use **Reset filters** to return to the page's starting choices when you get lost."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Part",
            "Simple meaning"
          ],
          "rows": [
            [
              "**Gross sales**",
              "The sales total shown by the report. It is not profit or cash counted by hand."
            ],
            [
              "**Average ticket**",
              "The average amount per sale in the report."
            ],
            [
              "**Orders**",
              "Number of sales in the report."
            ],
            [
              "**Gross margin (Admin)**",
              "A percentage comparing sales with recorded item costs. It is not final profit after all shop spending."
            ],
            [
              "**Category performance**",
              "How the item groups are doing."
            ],
            [
              "**Payment breakdown**",
              "How much is recorded under each payment method."
            ],
            [
              "**Transactions**",
              "The detailed rows for the chosen view."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Use the Transactions search for an invoice, customer, or cashier. Use **View All Orders** to open the full order page."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Save a report"
        },
        {
          "type": "paragraph",
          "text": "Set the needed filters, then click **Export CSV** or **Export PDF**. CSV is a file you can open in a spreadsheet. PDF is a report file for viewing or printing."
        },
        {
          "type": "remember",
          "text": "Check the business, locations, and dates before sharing a report. Sales, stock value, cash in a drawer, and profit are different numbers."
        }
      ],
      "searchIndex": "11. Reports — check sales over time Open: Left menu → Reports. Page heading: Sales Analytics & Reports. Choose what to see Choose Today, Yesterday, Daily, Weekly, Monthly, Quarterly, or Year. “Quarterly” means a three-month period. Choose a branch, or All Locations for the current business. Use the month, week, and year boxes where needed. Read the totals and the sales below. Use Reset filters to return to the page's starting choices when you get lost. Part Simple meaning Gross sales The sales total shown by the report. It is not profit or cash counted by hand. Average ticket The average amount per sale in the report. Orders Number of sales in the report. Gross margin (Admin) A percentage comparing sales with recorded item costs. It is not final profit after all shop spending. Category performance How the item groups are doing. Payment breakdown How much is recorded under each payment method. Transactions The detailed rows for the chosen view. Use the Transactions search for an invoice, customer, or cashier. Use View All Orders to open the full order page. Save a report Set the needed filters, then click Export CSV or Export PDF. CSV is a file you can open in a spreadsheet. PDF is a report file for viewing or printing. Remember Check the business, locations, and dates before sharing a report. Sales, stock value, cash in a drawer, and profit are different numbers."
    },
    {
      "id": "12-audit-logs--see-who-did-what",
      "number": 12,
      "title": "Audit Logs — see who did what",
      "fullTitle": "12. Audit Logs — see who did what",
      "blocks": [
        {
          "type": "callout",
          "label": "Open:",
          "text": "Left menu → **Audit Logs**. Page heading: **Audit Logs & Governance**."
        },
        {
          "type": "paragraph",
          "text": "This page helps you check saved actions, such as a stock change, refund, salary change, or staff change. It is a history page, not a page for making those changes."
        },
        {
          "type": "steps",
          "items": [
            "Click **Refresh Activity** to load the latest saved activity.",
            "Choose **All Actions & Events** to narrow the kind of action.",
            "Choose **All Entity Types** for the kind of item changed, such as a product, staff member, or order.",
            "Choose a branch if needed.",
            "Click **Filter by Date** and set **From Date (Dhaka)** and **To Date (Dhaka)**.",
            "Use **Search this page** to find words on the loaded page. Use the page arrows to check more results.",
            "Click **Inspect** on a row. Read **Event Summary**, **Performed By**, and the details shown.",
            "Close the box when done. Use **Reset Filters** to start again."
          ]
        },
        {
          "type": "paragraph",
          "text": "**Inspect** means “open the details”. It does not change the record. The stock, staff, and money-action counts can describe the current page or filtered view. Read the small text below each number."
        },
        {
          "type": "remember",
          "text": "Do not repeat a stock change or refund just because you are reading its old log. The action may already be complete."
        }
      ],
      "searchIndex": "12. Audit Logs — see who did what Open: Left menu → Audit Logs. Page heading: Audit Logs & Governance. This page helps you check saved actions, such as a stock change, refund, salary change, or staff change. It is a history page, not a page for making those changes. Click Refresh Activity to load the latest saved activity. Choose All Actions & Events to narrow the kind of action. Choose All Entity Types for the kind of item changed, such as a product, staff member, or order. Choose a branch if needed. Click Filter by Date and set From Date (Dhaka) and To Date (Dhaka). Use Search this page to find words on the loaded page. Use the page arrows to check more results. Click Inspect on a row. Read Event Summary, Performed By, and the details shown. Close the box when done. Use Reset Filters to start again. Inspect means “open the details”. It does not change the record. The stock, staff, and money-action counts can describe the current page or filtered view. Read the small text below each number. Remember Do not repeat a stock change or refund just because you are reading its old log. The action may already be complete."
    },
    {
      "id": "13-when-you-need-help",
      "number": 13,
      "title": "When you need help",
      "fullTitle": "13. When you need help",
      "blocks": [
        {
          "type": "heading",
          "level": 3,
          "text": "The list is empty"
        },
        {
          "type": "paragraph",
          "text": "Check the business and branch first. Clear search text and reset the relevant filters. Check the date or month. If a loading error is shown, click **Retry**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "My product is missing from the selling screen"
        },
        {
          "type": "paragraph",
          "text": "Check the branch and category filter. Open **Catalog** and check that the product has a variant. Use **Resume setup** or **Add Variant** when shown. A product name alone cannot be added to a sale."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "The price changed while I was selling"
        },
        {
          "type": "paragraph",
          "text": "Read the message. Check the new price and the ticket total with the customer. Check the cash amount again before **Complete sale**."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "I clicked Save or Pay, but the result is unclear"
        },
        {
          "type": "paragraph",
          "text": "A slow or lost internet reply does not prove the action failed."
        },
        {
          "type": "steps",
          "items": [
            "Stop. Do not start the same sale, refund, or salary action as a new one.",
            "Check the matching saved record: **Store Orders**, **Payroll**, or the relevant history.",
            "If the app offers **Retry exact ticket**, **Retry completion**, **Retry same sale**, or **Retry uncertain refund**, use that saved action without changing its details.",
            "If you still cannot tell what happened, contact the person who manages the app and give the bill number, time, and amount."
          ]
        },
        {
          "type": "paragraph",
          "text": "**Reconciled (Clear)** and **I checked history (Clear lock)** remove a warning lock. They do not refund or undo anything. Use them only after the saved result has been checked and you know the next step. An empty or still-loading list alone is not enough."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "I entered the wrong customer or amount on a saved sale"
        },
        {
          "type": "paragraph",
          "text": "Open **Store Orders** and check the bill. This page does not provide a general “edit paid sale” button. Use the correct refund process when needed, or ask for help. Do not create a second sale just to make the screen look right."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "The app will not delete something"
        },
        {
          "type": "paragraph",
          "text": "Read the message. The item may be linked to stock, sales, an open shift, or other saved records. Keep the history and ask for help rather than deleting related records one by one."
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Internet is not working"
        },
        {
          "type": "paragraph",
          "text": "Restore the connection before continuing. Do not treat an unsaved ticket or a held ticket as a paid sale."
        }
      ],
      "searchIndex": "13. When you need help The list is empty Check the business and branch first. Clear search text and reset the relevant filters. Check the date or month. If a loading error is shown, click Retry. My product is missing from the selling screen Check the branch and category filter. Open Catalog and check that the product has a variant. Use Resume setup or Add Variant when shown. A product name alone cannot be added to a sale. The price changed while I was selling Read the message. Check the new price and the ticket total with the customer. Check the cash amount again before Complete sale. I clicked Save or Pay, but the result is unclear A slow or lost internet reply does not prove the action failed. Stop. Do not start the same sale, refund, or salary action as a new one. Check the matching saved record: Store Orders, Payroll, or the relevant history. If the app offers Retry exact ticket, Retry completion, Retry same sale, or Retry uncertain refund, use that saved action without changing its details. If you still cannot tell what happened, contact the person who manages the app and give the bill number, time, and amount. Reconciled (Clear) and I checked history (Clear lock) remove a warning lock. They do not refund or undo anything. Use them only after the saved result has been checked and you know the next step. An empty or still-loading list alone is not enough. I entered the wrong customer or amount on a saved sale Open Store Orders and check the bill. This page does not provide a general “edit paid sale” button. Use the correct refund process when needed, or ask for help. Do not create a second sale just to make the screen look right. The app will not delete something Read the message. The item may be linked to stock, sales, an open shift, or other saved records. Keep the history and ask for help rather than deleting related records one by one. Internet is not working Restore the connection before continuing. Do not treat an unsaved ticket or a held ticket as a paid sale."
    },
    {
      "id": "14-simple-word-guide",
      "number": 14,
      "title": "Simple word guide",
      "fullTitle": "14. Simple word guide",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Word on screen",
            "Meaning"
          ],
          "rows": [
            [
              "**BDT**",
              "Taka."
            ],
            [
              "**Branch / Location**",
              "One shop place."
            ],
            [
              "**Category**",
              "A group of items."
            ],
            [
              "**Variant**",
              "One exact kind, size, or colour of a product."
            ],
            [
              "**SKU**",
              "A short code used to find an item."
            ],
            [
              "**Stock / Inventory**",
              "The recorded number of items in the shop."
            ],
            [
              "**Ticket / Order**",
              "A sale's item list. A ticket being prepared is not paid yet."
            ],
            [
              "**Invoice / Receipt**",
              "The bill number / the saved bill you can print."
            ],
            [
              "**Quantity**",
              "How many."
            ],
            [
              "**Subtotal / Total**",
              "The item-list amount / the amount for the sale shown."
            ],
            [
              "**Change**",
              "Cash to give back to the customer."
            ],
            [
              "**Refund**",
              "Record money returned for a saved sale."
            ],
            [
              "**Advance**",
              "Salary money taken early."
            ],
            [
              "**Deducted**",
              "Already taken away from salary."
            ],
            [
              "**Remaining / Outstanding**",
              "The amount still left."
            ],
            [
              "**Disburse / Process payroll**",
              "Record salary as paid."
            ],
            [
              "**Void**",
              "Cancel a record through the shown action."
            ],
            [
              "**Opening float**",
              "Cash put in the drawer at the start."
            ],
            [
              "**Expected cash**",
              "The amount the app expects from its recorded shift activity."
            ],
            [
              "**Variance**",
              "The difference between counted cash and expected cash."
            ],
            [
              "**Audit log**",
              "A saved record of who did something."
            ],
            [
              "**Inspect**",
              "Open the details."
            ],
            [
              "**Optional**",
              "You may leave this box empty."
            ]
          ]
        }
      ],
      "searchIndex": "14. Simple word guide Word on screen Meaning BDT Taka. Branch / Location One shop place. Category A group of items. Variant One exact kind, size, or colour of a product. SKU A short code used to find an item. Stock / Inventory The recorded number of items in the shop. Ticket / Order A sale's item list. A ticket being prepared is not paid yet. Invoice / Receipt The bill number / the saved bill you can print. Quantity How many. Subtotal / Total The item-list amount / the amount for the sale shown. Change Cash to give back to the customer. Refund Record money returned for a saved sale. Advance Salary money taken early. Deducted Already taken away from salary. Remaining / Outstanding The amount still left. Disburse / Process payroll Record salary as paid. Void Cancel a record through the shown action. Opening float Cash put in the drawer at the start. Expected cash The amount the app expects from its recorded shift activity. Variance The difference between counted cash and expected cash. Audit log A saved record of who did something. Inspect Open the details. Optional You may leave this box empty."
    }
  ]
};
