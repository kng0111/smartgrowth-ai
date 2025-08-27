// Metrics for dashboard
const metrics = [
  { label: "Active Campaigns", value: 5 },
  { label: "Monthly Visitors", value: "12,340" },
  { label: "Conversion Rate", value: "3.2%" },
  { label: "Ad Spend ($)", value: "4,800" }
];

const metricsContainer = document.getElementById("metrics");
if (metricsContainer) {
  metrics.forEach(m => {
    const div = document.createElement("div");
    div.className = "metric";
    div.innerHTML =
      `<div class="metric-value">${m.value}</div>
      <div class="metric-label">${m.label}</div>`;
    metricsContainer.appendChild(div);
  });
}

// Insights
const insights = [
  "Your Facebook campaigns are performing better than Google Ads. Try shifting more budget to Facebook for higher returns.",
  "Posting blog articles on Tuesdays leads to more customer engagement.",
  "Automated email follow-ups increased conversions last month.",
  "The headline 'Save More Now' gets more clicks than 'Limited Offer'. Consider updating your promotions!"
];

const insightsContent = document.getElementById("insights-content");
if (insightsContent) {
  insightsContent.innerHTML = "<ul>" +
    insights.map(i => `<li>${i}</li>`).join('') +
    "</ul>";
}

// Campaign suggestions
const campaignSamples = [
  "Blog Topic: 'Top 5 Digital Marketing Mistakes Small Businesses Make.'",
  "Social Post: 'Grow your business with SmartGrowth AI – Try it free today!'",
  "Email: 'Hi {{name}}, our AI tools make marketing easy. Start your journey with SmartGrowth AI.'"
];

const generateContentBtn = document.getElementById("generate-content");
const contentOutput = document.getElementById("content-output");
if (generateContentBtn && contentOutput) {
  generateContentBtn.addEventListener("click", () => {
    generateContentBtn.disabled = true;
    generateContentBtn.innerHTML = `<img src="assets/icons/campaigns.svg" class="nav-icon" alt="Magic"> Generating...`;
    setTimeout(() => {
      contentOutput.innerHTML = "<ul>" +
        campaignSamples.map(c => `<li>${c}</li>`).join('') +
        "</ul>";
      generateContentBtn.disabled = false;
      generateContentBtn.innerHTML = `<img src="assets/icons/campaigns.svg" class="nav-icon" alt="Magic"> Get AI Suggestions`;
    }, 900);
  });
}