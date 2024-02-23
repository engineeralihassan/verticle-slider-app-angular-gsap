
import { Component, OnInit } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Draggable from 'gsap/Draggable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  seamlessLoop: any;
  trigger: any;
  iteration: number = 0;

  constructor() { }

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger, Draggable);

    gsap.set('.gallery', { autoAlpha: 1 });
    gsap.set('.cards li', { yPercent: 400, opacity: 0, scale: 0 });

    const spacing = 0.1,
      snapTime = gsap.utils.snap(spacing),
      cards = gsap.utils.toArray('.cards li'),
      animateFunc = (element: any) => {
        const tl = gsap.timeline();
        tl.fromTo(element, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false })
          .fromTo(element, { yPercent: 400 }, { yPercent: -400, duration: 1, ease: "none", immediateRender: false }, 0);
        return tl;
      };

    this.seamlessLoop = this.buildSeamlessLoop(cards, spacing, animateFunc);

    this.trigger = ScrollTrigger.create({
      start: 0,
      onUpdate: (self) => {
        let scroll = self.scroll();
        if (scroll > self.end - 1) {
          this.wrap(1, 1);
        } else if (scroll < 1 && self.direction < 0) {
          this.wrap(-1, self.end - 1);
        } else {
          this.updateScrub(self);
        }
      },
      end: "+=3000",
      pin: ".gallery"
    });

    ScrollTrigger.addEventListener("scrollEnd", () => this.scrollToOffset());

    document.querySelector(".next")?.addEventListener("click", () => this.scrollToOffset(spacing));
    document.querySelector(".prev")?.addEventListener("click", () => this.scrollToOffset(-spacing));
  }

  buildSeamlessLoop(items: any, spacing: any, animateFunc: any) {
    let rawSequence = gsap.timeline({ paused: true }),
      seamlessLoop = gsap.timeline({
        paused: true,
        repeat: -1,
        onRepeat() {
          this['_time'] === this['_dur'] && (this['_tTime'] += this['_dur'] - 0.01);
        },
        onReverseComplete() {
          this['totalTime'](this['rawTime']() + this['duration']() * 100);
        }
      }),
      cycleDuration = spacing * items.length,
      dur: number = 0;

    items.concat(items).concat(items).forEach((item: any, i: number) => {
      let anim = animateFunc(items[i % items.length]);
      rawSequence.add(anim, i * spacing);
      dur || (dur = anim.duration());
    });

    seamlessLoop.fromTo(rawSequence, {
      time: cycleDuration + dur / 2
    }, {
      time: "+=" + cycleDuration,
      duration: cycleDuration,
      ease: "none"
    });
    return seamlessLoop;
  }

  scrollToOffset(offset: number = 0) {
    let snappedTime = this.snapTime(this.seamlessLoop.time() + offset * this.seamlessLoop.duration()),
      progress = snappedTime / this.seamlessLoop.duration(),
      scroll = this.progressToScroll(progress);
    if (progress >= 1 || progress < 0) {
      return this.wrap(Math.floor(progress), scroll);
    }
    this.trigger.scroll(scroll);
  }

  wrap(iterationDelta: number, scrollTo: number) {
    this.iteration += iterationDelta;
    this.trigger.scroll(scrollTo);
    this.trigger.update();
  }

  updateScrub(self: any) {
    let offset = (this.iteration + self.progress) * this.seamlessLoop.duration();
    this.seamlessLoop.time(this.wrapTime(offset));
  }

  snapTime(offset: number) {
    return gsap.utils.snap(0.1)(offset);
  }

  progressToScroll(progress: number) {
    return gsap.utils.clamp(1, this.trigger.end - 1, gsap.utils.wrap(0, 1, progress) * this.trigger.end);
  }

  wrapTime(offset: number) {
    return gsap.utils.wrap(0, this.seamlessLoop.duration())(offset);
  }

}

