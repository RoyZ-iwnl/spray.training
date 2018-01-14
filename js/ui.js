import TweenMax from 'gsap';

exports.fadeFromTo = (pageOne, pageTwo, t) => {
  TweenMax.fromTo(pageOne, t, {autoAlpha: 1}, {autoAlpha: 0});
  TweenMax.fromTo(pageTwo, t, {autoAlpha: 0}, {autoAlpha: 1});
};
