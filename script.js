const hamburgerBtn = document.getElementById('hamburgerBtn');
const nav = document.getElementById('nav');
const navBackdrop = document.getElementById('navBackdrop');
const navItems = document.querySelectorAll('.nav__item');
const pagesTrack = document.getElementById('pagesTrack');

function openNav() {
  nav.classList.add('is-open');
  navBackdrop.classList.add('is-open');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
}

function closeNav() {
  nav.classList.remove('is-open');
  navBackdrop.classList.remove('is-open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}

hamburgerBtn.addEventListener('click', () => {
  const isOpen = nav.classList.contains('is-open');
  isOpen ? closeNav() : openNav();
});

navBackdrop.addEventListener('click', closeNav);

/* 메뉴 항목 클릭해도 자동으로 닫지 않음 — 배경(navBackdrop) 터치로만 닫힘 */

/* ==============================================
   페이지 전환 — MAIN/QUICKLINK/GUIDE/ONECLICK/TIMETABLE이 .pages 안에
   가로로 나란히 있고(필름스트립), nav 클릭 시 .pages 전체를 옆으로 밀어서
   이전 화면은 빠지고 다음 화면이 들어오게 함 (개별 화면이 아니라 컨테이너 하나만 움직임)
============================================== */
const PAGE_ORDER = ['main', 'quicklink', 'guide', 'oneclick', 'timetable'];

function goToPage(name) {
  const index = PAGE_ORDER.indexOf(name);
  if (index === -1) return;
  // 트랙 폭이 500%(페이지 5개)라서, 한 칸 이동 = 트랙 자기 폭의 20%
  pagesTrack.style.transform = `translateX(-${index * 20}%)`;
  setCurrent(name);
  if (name === 'main') animateProgress(); // MAIN으로 돌아올 때마다 달성률 바 다시 차오르게
}

/* 메뉴 클릭 시 해당 화면으로 이동, 1초 뒤 메뉴 자연스럽게 닫힘(바로 닫히면 어색해서 약간의 딜레이) */
navItems.forEach((item) => {
  item.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    goToPage(item.dataset.target);
    setTimeout(closeNav, 400);
  });
});

/* nav 취소선 표시 갱신 */
function setCurrent(id) {
  navItems.forEach((item) => {
    item.classList.toggle('is-current', item.dataset.target === id);
  });
}

/* 초기 상태 */
setCurrent('main');

/* ==============================================
   아이디 달성률 바 — 0에서 목표치까지 차오르는 애니메이션
============================================== */
const progressFill = document.getElementById('progressFill');

function animateProgress() {
  if (!progressFill) return;
  const target = progressFill.dataset.progress + '%';
  progressFill.style.width = '0%';
  void progressFill.offsetWidth; // 강제 리플로우 — 0%로 리셋된 상태를 화면에 반영시켜서 다시 재생되게 함
  requestAnimationFrame(() => {
    progressFill.style.width = target;
  });
}

animateProgress();

/* ==============================================
   메인 배너 캐러셀 무한 루프
   구조: [4번 복제] [1] [2] [3] [4] [1번 복제]
   맨 앞/뒤 복제 카드에 스크롤이 멈추면, 애니메이션 없이
   반대편의 진짜 카드 위치로 순간이동시켜서 끊김 없이 도는 것처럼 보이게 함
============================================== */
const carousel = document.getElementById('bannerCarousel');
const bannerDots = document.querySelectorAll('.banner-carousel__dot');

if (carousel) {
  const cards = [...carousel.children];
  const firstRealCard = cards.find((c) => c.dataset.index === '1');
  const lastRealCard = [...cards].reverse().find((c) => c.dataset.index);

  function jumpTo(card) {
    const target = card.offsetLeft - (carousel.clientWidth - card.clientWidth) / 2;
    carousel.scrollLeft = target; // scrollTo가 아닌 scrollLeft 직접 대입 = 애니메이션 없이 순간이동
  }

  function setActiveDot(index) {
    bannerDots.forEach((dot) => dot.classList.toggle('is-active', dot.dataset.index === index));
  }

  // 스크롤 중 중앙 카드는 원래 크기, 옆으로 갈수록 살짝 작아지는 코너플로우 느낌
  function updateCardScales() {
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    cards.forEach((card) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distanceRatio = Math.min(Math.abs(cardCenter - center) / carousel.clientWidth, 1);
      const scale = 1 - distanceRatio * 0.12;
      card.style.transform = `scale(${scale})`;
    });
  }

  // 첫 진입 시 진짜 1번 카드 위치에서 시작 (맨 앞 복제 카드가 보이지 않도록)
  jumpTo(firstRealCard);
  setActiveDot('1');
  updateCardScales();

  carousel.addEventListener('scroll', updateCardScales);

  let scrollEndTimer = null;
  carousel.addEventListener('scroll', () => {
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      const nearest = cards.reduce((closest, card) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const closestCenter = closest.offsetLeft + closest.clientWidth / 2;
        return Math.abs(cardCenter - center) < Math.abs(closestCenter - center) ? card : closest;
      });

      let realCard = nearest;
      if (nearest.dataset.clone) {
        // 복제 카드 위치에서 멈췄으면 반대편 진짜 카드로 순간이동
        const isLeadingClone = nearest === cards[0];
        realCard = isLeadingClone ? lastRealCard : firstRealCard;
        jumpTo(realCard);
      }
      setActiveDot(realCard.dataset.index);
    }, 120);
  });

  bannerDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const card = cards.find((c) => c.dataset.index === dot.dataset.index);
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });
}

/* ==============================================
   이미지 가이드 뷰어 — [data-guide-image] 링크 클릭하면 그 이미지를 풀페이지로 보여줌.
   이미지가 세로로 길 수 있어서 모달이 아니라 페이지째로 스크롤되는 형태.
   가이드 링크가 늘어나도 링크에 data-guide-image="경로"만 붙이면 이 로직 그대로 재사용됨
============================================== */
const imageViewer = document.getElementById('imageViewer');
const imageViewerImg = document.getElementById('imageViewerImg');
const imageViewerClose = document.getElementById('imageViewerClose');

function openImageViewer(src) {
  imageViewerImg.src = src;
  imageViewer.scrollTop = 0; // 이전에 보던 이미지 스크롤 위치가 남아있지 않도록
  imageViewer.classList.add('is-open');
}

function closeImageViewer() {
  imageViewer.classList.remove('is-open');
}

document.querySelectorAll('[data-guide-image]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openImageViewer(link.dataset.guideImage);
  });
});

imageViewerClose.addEventListener('click', closeImageViewer);
