document.addEventListener('DOMContentLoaded', async () => {
  const { fetchJson } = window.NotifyApp;

  try {
    const [statsRes, reportRes] = await Promise.all([
      fetchJson('/api/dashboard/stats'),
      fetchJson('/api/dashboard/report'),
    ]);

    const stats = statsRes.data;
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('tasksAssigned').textContent = stats.tasksAssigned;
    document.getElementById('tasksCompleted').textContent = stats.tasksCompleted;
    document.getElementById('announcementsSent').textContent = stats.announcementsSent;
    document.getElementById('messagesDelivered').textContent = stats.messagesDelivered;

    const activity = reportRes.data.recentActivity || [];
    const container = document.getElementById('recentActivity');
    container.innerHTML = activity.length
      ? activity.map((item) => `
          <div class="log-item">
            <h3>${item.actionType}</h3>
            <p>${item.description}</p>
            <span class="badge">${new Date(item.timestamp).toLocaleString()}</span>
          </div>
        `).join('')
      : '<div class="log-item"><p>No recent activity yet.</p></div>';
  } catch (error) {
    document.getElementById('recentActivity').innerHTML = `<div class="log-item"><p>${error.message}</p></div>`;
  }
});
