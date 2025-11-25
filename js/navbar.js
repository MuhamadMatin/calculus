// Kode untuk active state pada menu navigasi
document.addEventListener('DOMContentLoaded', function () {
  // Mendapatkan path halaman saat ini
  const currentPath = window.location.pathname;

  // Mendapatkan semua link navigasi
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // Fungsi untuk menandai link yang aktif
  function setActiveLink() {
    // Reset semua link terlebih dahulu
    navLinks.forEach((link) => link.classList.remove('active'));
    mobileNavLinks.forEach((link) => link.classList.remove('active'));

    // Cari link yang sesuai dengan halaman saat ini
    let activeFound = false;

    // Cek untuk setiap link
    navLinks.forEach((link) => {
      const linkPath = new URL(link.href).pathname;

      // Jika path link sama dengan path halaman saat ini
      if (linkPath === currentPath) {
        link.classList.add('active');
        activeFound = true;
      }
    });

    // Lakukan hal yang sama untuk mobile menu
    mobileNavLinks.forEach((link) => {
      const linkPath = new URL(link.href).pathname;

      if (linkPath === currentPath) {
        link.classList.add('active');
        activeFound = true;
      }
    });
  }

  // Panggil fungsi saat halaman dimuat
  setActiveLink();

  // Toggle menu mobile
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenuButton.classList.toggle('active');
  });

  // Tutup menu mobile saat klik di luar
  document.addEventListener('click', (event) => {
    const isClickInside = mobileMenu.contains(event.target) || mobileMenuButton.contains(event.target);

    if (!isClickInside && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      mobileMenuButton.classList.remove('active');
    }
  });

  // Tambahkan event listener untuk setiap link di mobile menu
  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenuButton.classList.remove('active');
    });
  });
});
