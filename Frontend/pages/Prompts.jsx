import React from 'react';
import './Prompts.css'; // We'll create this CSS below

const Prompts = () => {
  const prompts = [
    {
      title: "Extract Basic Invoice Fields",
      description: "A simple prompt to pull out core details like invoice number, date, vendor, and total from any invoice document.",
      prompt: "Extract the following fields from this invoice image or PDF: invoice_number, invoice_date, vendor_name, total_amount. Output in JSON format.",
      sampleOutput: `{
  "invoice_number": "INV-2025-001",
  "invoice_date": "2025-09-13",
  "vendor_name": "Tech Supplies Inc.",
  "total_amount": "$1,250.00"
}`,
      hasImage: false
    },
    {
      title: "Extract Line Items and Totals",
      description: "Ideal for invoices with multiple items. Extracts quantities, prices, and subtotals for detailed analysis.",
      prompt: "From this invoice, extract all line items including item_description, quantity, unit_price, total_price. Also include due_date and tax_amount. Format as structured JSON.",
      sampleOutput: `{
  "line_items": [
    {
      "item_description": "Laptop Charger",
      "quantity": 2,
      "unit_price": "$25.00",
      "total_price": "$50.00"
    },
    {
      "item_description": "USB Cable",
      "quantity": 5,
      "unit_price": "$10.00",
      "total_price": "$50.00"
    }
  ],
  "due_date": "2025-10-13",
  "tax_amount": "$20.00",
  "grand_total": "$1,250.00"
}`,
      hasImage: true // Placeholder for an image; in production, import and use <img src={sampleInvoiceImg} />
    },
    {
      title: "Summarize Invoice Insights",
      description: "Generates a quick summary and key insights, like total spend by category, for business reporting.",
      prompt: "Analyze this invoice: Summarize the total spend, top items by cost, and any payment terms. Provide insights on potential savings.",
      sampleOutput: "Total Spend: $1,250.00\nTop Items: Laptop Charger ($50.00), USB Cables ($50.00)\nPayment Terms: Net 30 days\nInsight: Bulk purchase discount could save 10% on future orders.",
      hasImage: false
    },
    {
      title: "Validate and Flag Anomalies",
      description: "Checks for errors like mismatched totals or unusual dates, useful for AP teams.",
      prompt: "Validate this invoice data: Check if totals match line items, flag if due_date is past, and verify vendor against known list. Output JSON with flags.",
      sampleOutput: `{
  "validation": {
    "totals_match": true,
    "due_date_past": false,
    "vendor_verified": true
  },
  "flags": [],
  "message": "Invoice is valid and ready for approval."
}`,
      hasImage: true
    }
  ];

  return (
    <div className="prompts">
      <div className="prompts-header">
        <h1>AI Prompts for Invoice Analysis</h1>
        <p>Discover ready-to-use prompts for extracting and analyzing invoice data. Copy them into your chatbot for instant results. Each includes a sample output based on real-world examples.</p>
      </div>
      <div className="prompts-content">
        <div className="prompts-grid">
          {prompts.map((prompt, index) => (
            <div key={index} className="prompt-card">
              <div className="prompt-header">
                <h3>{prompt.title}</h3>
                <p className="prompt-description">{prompt.description}</p>
              </div>
              <div className="prompt-body">
                <div className="prompt-section">
                  <h4>Prompt</h4>
                  <div className="prompt-text">
                    <code>{prompt.prompt}</code>
                  </div>
                </div>
                {prompt.hasImage && (
                  <div className="image-section">
                    <h4>Sample Input (Invoice Image)</h4>
                    <div className="placeholder-image">
                      {/* Placeholder; replace with actual <img src={sampleImage} alt="Sample Invoice" /> */}
                      <p>[Sample Invoice Image Here]</p>
                    </div>
                  </div>
                )}
                <div className="output-section">
                  <h4>Sample Output</h4>
                  <pre className="output-code">{prompt.sampleOutput}</pre>
                </div>
              </div>
              <button className="copy-btn">Copy Prompt</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prompts;