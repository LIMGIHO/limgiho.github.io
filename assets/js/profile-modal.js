document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('profile-modal');
  const button = document.querySelector('.profile-image-button');
  const closeBtn = document.querySelector('.profile-modal-close');

  if (button && modal) {
    button.addEventListener('click', () => {
      modal.showModal();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.close();
    });
  }

  // 배경 클릭으로도 닫기
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });

    // ESC 키로 닫기 (dialog 기본 동작)
    modal.addEventListener('cancel', (e) => {
      e.preventDefault();
      modal.close();
    });
  }
});
