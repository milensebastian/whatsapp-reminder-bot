document.addEventListener('DOMContentLoaded', async () => {
  const { fetchJson } = window.NotifyApp;

  try {
    const report = await fetchJson('/api/dashboard/report');
    const stats = report.data.stats;
    document.getElementById('analyticsTable').innerHTML = `
      <tr><td>Total Users</td><td>${stats.totalUsers}</td></tr>
      <tr><td>Tasks Assigned</td><td>${stats.tasksAssigned}</td></tr>
      <tr><td>Tasks Completed</td><td>${stats.tasksCompleted}</td></tr>
      <tr><td>Announcements Sent</td><td>${stats.announcementsSent}</td></tr>
      <tr><td>Messages Delivered</td><td>${stats.messagesDelivered}</td></tr>
    `;

    const activity = report.data.recentActivity || [];
    document.getElementById('analyticsActivity').innerHTML = activity.length
      ? activity.map((item) => `
          <div class="log-item">
            <h3>${item.actionType}</h3>
            <p>${item.description}</p>
            <span class="badge">${new Date(item.timestamp).toLocaleString()}</span>
          </div>
        `).join('')
      : '<div class="log-item"><p>No analytics activity found.</p></div>';

    const latestPoll = report.data.latestPollResults;
    document.getElementById('pollResults').innerHTML = latestPoll
      ? `
          <div class="list-item">
            <h3>${latestPoll.question}</h3>
            <p><strong>Total Votes:</strong> ${latestPoll.totalVotes}</p>
            ${(latestPoll.results || []).map((result) => `
              <div class="log-item">
                <h3>${result.optionNumber}. ${result.option}</h3>
                <p>${result.count} votes</p>
                <span class="badge">${result.percentage}%</span>
              </div>
            `).join('')}
          </div>
        `
      : '<div class="list-item"><p>No poll results available yet.</p></div>';
  } catch (error) {
    document.getElementById('analyticsActivity').innerHTML = `<div class="log-item"><p>${error.message}</p></div>`;
    document.getElementById('pollResults').innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
  }
});
