
import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import './Prompt.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Prompt = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    const queries = [
        {
            id: 'Q1',
            title: 'Invoice Number and Total Amount Due',
            description: 'Extracts the invoice number and the total amount due from the invoice.',
            sampleOutput: 'Invoice Number: INV-2023-001, Total Amount Due: $1,250.00',
            category: 'Data Extraction',
            fullPrompt: 'What is the invoice number and the total amount due?',
        },
        {
            id: 'Q2',
            title: 'Vendor and Address',
            description: 'Identifies the vendor name and their address listed on the invoice.',
            sampleOutput: 'Vendor: ABC Supplies, Address: 123 Main St, Springfield, IL 62701',
            category: 'Data Extraction',
            fullPrompt: 'Who is the vendor and what is their address?',
        },
        {
            id: 'Q3',
            title: 'Invoice Date and Due Date',
            description: 'Provides the issuance date of the invoice and any specified due date.',
            sampleOutput: 'Invoice Date: 2023-10-01, Due Date: 2023-10-15',
            category: 'Data Extraction',
            fullPrompt: 'What is the invoice date and is there a due date?',
        },
        {
            id: 'Q4',
            title: 'Number of Unique Items',
            description: 'Counts the total number of unique items listed on the invoice.',
            sampleOutput: 'Unique Items: 5',
            category: 'Data Extraction',
            fullPrompt: 'How many unique items are listed on the invoice?',
        },
        {
            id: 'Q5',
            title: 'Subtotal and Tax Amount',
            description: 'Extracts the subtotal and the tax amount for the invoice.',
            sampleOutput: 'Subtotal: $1,000.00, Tax Amount: $250.00',
            category: 'Data Extraction',
            fullPrompt: 'What is the subtotal and the tax amount for this invoice?',
        },
        {
            id: 'Q6',
            title: 'Line Items and Most Expensive Item',
            description: 'Extracts the number of line items included on the invoice and identifies the most expensive item.',
            sampleOutput: 'Line Items: 3, Most Expensive Item: Widget C ($200.00 per unit)',
            category: 'Data Extraction',
            fullPrompt: 'How many line items are included, and what is the most expensive item?'
        },
        {
            id: 'Q7',
            title: 'Bar Chart of Item Quantities',
            description: 'Generates a bar chart illustrating the quantity of each item purchased to identify high-volume products.',
            dataNeeded: 'The quantity for each line item, along with its description.',
            whyUseful: 'A bar chart provides a clear visual comparison of quantities, making it easy to see which items were the most popular.',
            sampleOutput: 'Bar chart generated (see preview).',
            category: 'Visualization',
            fullPrompt: 'Generate a bar chart illustrating the quantity of each item purchased. Use this to identify which products were bought in the highest volume.\nData needed: The quantity for each line item, along with its description.\nWhy it\'s useful: A bar chart provides a clear visual comparison of quantities, making it easy to see which items were the most popular.',
            chart: {
                type: 'bar',
                data: {
                    labels: ['Item A', 'Item B', 'Item C', 'Item D'],
                    datasets: [{
                        label: 'Quantity',
                        data: [10, 15, 8, 12],
                        backgroundColor: 'rgba(99, 102, 241, 0.7)',
                        borderColor: '#6366f1',
                        borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: '#e2e8f0', font: { size: 14 } } },
                        tooltip: { backgroundColor: '#1e293b', titleColor: '#e2e8f0', bodyColor: '#e2e8f0' },
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#e2e8f0', font: { size: 12 } } },
                        x: { ticks: { color: '#e2e8f0', font: { size: 12 } } },
                    },
                },
            },
        },
        {
            id: 'Q8',
            title: 'Pie Chart of Subtotal Contribution',
            description: 'Creates a pie chart showing the percentage of the subtotal contributed by each line item to highlight revenue sources.',
            dataNeeded: 'The total price for each line item and the invoice subtotal.',
            whyUseful: 'A pie chart is excellent for visualizing parts of a whole, allowing a quick assessment of each item’s contribution to the overall revenue.',
            sampleOutput: 'Pie chart generated (see preview).',
            category: 'Visualization',
            fullPrompt: 'Create a pie chart showing the percentage of the subtotal contributed by each line item. This will highlight which product generated the most revenue before taxes.\nData needed: The total price for each line item and the invoice subtotal.\nWhy it\'s useful: A pie chart is excellent for visualizing parts of a whole, allowing a quick assessment of each item’s contribution to the overall revenue.',
            chart: {
                type: 'pie',
                data: {
                    labels: ['Item A', 'Item B', 'Item C', 'Item D'],
                    datasets: [{
                        data: [300, 450, 200, 350],
                        backgroundColor: ['#6366f1', '#3b82f6', '#93c5fd', '#1e293b'],
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right', labels: { color: '#e2e8f0', font: { size: 14 } } },
                        tooltip: { backgroundColor: '#1e293b', titleColor: '#e2e8f0', bodyColor: '#e2e8f0' },
                    },
                },
            },
        },
        {
            id: 'Q9',
            title: 'Bar Chart of Unit Prices',
            description: 'Generates a bar chart comparing the unit price of each item to visualize cost differences.',
            dataNeeded: 'The description and unit price of each line item.',
            whyUseful: 'A bar chart makes it simple to compare individual values, providing a quick way to identify the most and least expensive items.',
            sampleOutput: 'Bar chart generated (see preview).',
            category: 'Visualization',
            fullPrompt: 'Generate a bar chart comparing the unit price of each item on the invoice. This helps to visualize the cost differences between the products.\nData needed: The description and unit price of each line item.\nWhy it\'s useful: A bar chart makes it simple to compare individual values, providing a quick way to identify the most and least expensive items.',
            chart: {
                type: 'bar',
                data: {
                    labels: ['Item A', 'Item B', 'Item C', 'Item D'],
                    datasets: [{
                        label: 'Unit Price ($)',
                        data: [30, 25, 50, 40],
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: '#e2e8f0', font: { size: 14 } } },
                        tooltip: { backgroundColor: '#1e293b', titleColor: '#e2e8f0', bodyColor: '#e2e8f0' },
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#e2e8f0', font: { size: 12 } } },
                        x: { ticks: { color: '#e2e8f0', font: { size: 12 } } },
                    },
                },
            },
        },
    ];

    const copyAllPrompts = () => {
        const allPrompts = queries.map((q) => q.fullPrompt).join('\n\n');
        navigator.clipboard.writeText(allPrompts);
        setCopiedId('all');
        setTimeout(() => setCopiedId(null), 2000); // Reset after 2s
    };

    const copyToClipboard = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000); // Reset after 2s
    };

    const filteredQueries = queries.filter(
        (query) =>
            query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            query.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleCard = (id) => {
        setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="prompt-page">
            <div className="prompt-header">
                <h1>Invoice Analysis Prompts</h1>
                <p>Explore and copy powerful AI-driven prompts to extract and visualize invoice data with precision.</p>
                <div className="prompt-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search prompts by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search prompts"
                        />
                    </div>
                    <button
                        className={`copy-all-button ${copiedId === 'all' ? 'copied' : ''}`}
                        onClick={copyAllPrompts}
                        aria-label="Copy all prompts"
                    >
                        {copiedId === 'all' ? 'Copied!' : 'Copy All Prompts'}
                    </button>
                </div>
            </div>
            <div className="prompt-content">
                <div className="queries-section">
                    <h2>Available Prompts</h2>
                    <div className="queries-grid">
                        {filteredQueries.map((query) => (
                            <div key={query.id} className="query-card">
                                <div
                                    className="query-card-header"
                                    onClick={() => toggleCard(query.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && toggleCard(query.id)}
                                >
                                    <div className="query-icon">
                                        <span>{query.id}</span>
                                    </div>
                                    <h3>{query.title}</h3>

                                </div>
                                <div className={`query-card-content ${expandedCards[query.id] ? 'expanded' : ''}`}>
                                    <p><strong>Prompt:</strong> {query.fullPrompt}</p>
                                    <p><strong>Description:</strong> {query.description}</p>
                                    {query.dataNeeded && (
                                        <p><strong>Data Needed:</strong> {query.dataNeeded}</p>
                                    )}
                                    {query.whyUseful && (
                                        <p><strong>Why It's Useful:</strong> {query.whyUseful}</p>
                                    )}
                                    <p><strong>Sample Output:</strong> {query.sampleOutput}</p>
                                    <button
                                        className={`copy-button ${copiedId === query.id ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(query.id, query.fullPrompt)}
                                        aria-label={`Copy prompt for ${query.title}`}
                                    >
                                        {copiedId === query.id ? 'Copied!' : 'Copy Prompt'}
                                    </button>
                                    {query.chart && (
                                        <div className="query-chart">
                                            {query.chart.type === 'bar' ? (
                                                <Bar data={query.chart.data} options={query.chart.options} />
                                            ) : (
                                                <Pie data={query.chart.data} options={query.chart.options} />
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Prompt;
