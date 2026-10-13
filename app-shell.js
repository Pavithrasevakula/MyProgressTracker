// Update sync modal with user info when opened
window.addEventListener('load', function() {
  const origOpenModal = window.openModal;
  window.openModal = function(id) {
    if (origOpenModal) origOpenModal(id);
    else document.getElementById(id).classList.add('show');
    
    if (id === 'syncModal' && window.currentUser) {
      const emailEl = document.getElementById('modalUserEmail');
      const syncEl = document.getElementById('lastSyncTime') || document.getElementById('modalLastSync');
      if (emailEl) emailEl.textContent = window.currentUser.email;
      if (syncEl) {
        const last = localStorage.getItem('lastCloudSync');
        if (last) {
          const date = new Date(last);
          const now = new Date();
          const diff = Math.floor((now - date) / 1000);
          if (diff < 60) syncEl.textContent = 'Just now';
          else if (diff < 3600) syncEl.textContent = Math.floor(diff / 60) + ' min ago';
          else if (diff < 86400) syncEl.textContent = Math.floor(diff / 3600) + ' hrs ago';
          else syncEl.textContent = date.toLocaleDateString();
        }
      }
    }
  };
});
