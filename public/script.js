// GSAP Animations and lightweight UI enhancements
document.addEventListener('DOMContentLoaded', () => {
  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
    // Header subtle entrance
    gsap.from('.app-header', {
      opacity: 0,
      y: -15,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Form and filter cards subtle stagger entrance
    gsap.from(['.form-card', '.filter-card', '.table-card'], {
      opacity: 0,
      y: 12,
      duration: 0.45,
      stagger: 0.1,
      ease: 'power2.out'
    });

    // Alert entrance if present
    const alerts = document.querySelectorAll('.alert');
    if (alerts.length > 0) {
      gsap.from(alerts, {
        opacity: 0,
        scale: 0.98,
        duration: 0.35,
        ease: 'back.out(1.2)'
      });
    }

    // Gentle hover animation on submit button
    const btnCreate = document.querySelector('.btn-create');
    if (btnCreate) {
      btnCreate.addEventListener('mouseenter', () => {
        gsap.to(btnCreate, { scale: 1.02, duration: 0.2 });
      });
      btnCreate.addEventListener('mouseleave', () => {
        gsap.to(btnCreate, { scale: 1, duration: 0.2 });
      });
    }
  }
});
