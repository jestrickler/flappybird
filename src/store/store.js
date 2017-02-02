import {bg, fg, bird, pipe} from './asset'
import {width, height} from '../common/common'
import {bg_w, bg_h, fg_w, fg_h, bird_w, bird_h, pipe_w, pipe_h} from '../common/Sprite'
import {action, observable , useStrict } from 'mobx';

useStrict(true);

// background
const bg1 = new bg(guid(), 0, height - bg_h);
const bg2 = new bg(guid(), bg_w, height - bg_h);
const bg3 = new bg(guid(), bg_w*2, height - bg_h);

// moving foreground
const fg1 = new fg(guid(), 0, height - fg_h);
const fg2 = new fg(guid(), fg_w, height - fg_h);
const fg3 = new fg(guid(), fg_w*2, height - fg_h);

export const states = {
   Splash: 0, Game: 1, Score: 2
};

//Game state
export const game = observable({
    currentstate: 1,
});

export const store = {
  fgpos: 0,
  frames: 1,
  bgs: [ bg1, bg2, bg3 ],
  fgs: [ fg1, fg2, fg3 ],
  bird : new bird(guid(),60,0),
  pipes: observable([]), //initialize with empty pipes
};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

export const birdflap =  action(function(bird) {
    bird.velocity = -bird._flap;
});

const updateBird = function(bird) {
  //at every 10th, frame change bird frame
  bird.frame += store.frames % 10 === 0 ? 1 : 0;
  bird.frame %= bird.animation.length;

  if (game.currentstate === states.Splash) { //if splash screen make the bird hover
    bird.cy = height - 280 + 5*Math.cos(store.frames/10)  // ~199 - ~201
    bird.rotation = 0;
  } else {

    bird.velocity += bird.gravity;
    bird.cy += bird.velocity;

    if (bird.cy >= height - fg_h - 10) {
      bird.cy = height - fg_h - 10;
      if (game.currentstate === states.Game) {
        game.currentstate = states.Score;
      }
      // sets velocity to flap speed for correct rotation
      bird.velocity = bird._flap;
    }

    // when bird lacks upward momentum increment the rotation angle
    if (bird.velocity >= bird._flap) {
      bird.frame = 1;
      bird.rotation = Math.min(Math.PI / 2, bird.rotation + 0.1);
    } else {
      bird.rotation = -0.2;
    }
  }
};

const updatePipes = function() {
  if (store.frames % 100 === 0) {
    var _y = height - (pipe_h + fg_h +120+200*Math.random());
    store.pipes.push(
      new pipe(guid(), width, _y, "S"),
      new pipe(guid(), width, _y+100+ pipe_h, "N")
    )
  }

  store.pipes.forEach( (p) => {
    // check for collision
    const bird = store.bird
    var cx = Math.min(Math.max(bird.cx + bird_w/2 , p.cx), p.cx + pipe_w);
    var cy = Math.min(Math.max(bird.cy + bird_h/2, p.cy), p.cy + pipe_h);

    // closest difference
    var dx = bird.cx + bird_w/2 - cx;
    var dy = bird.cy + bird_h/2 - cy;

    // vector length
    var d1 = dx*dx + dy*dy;
    var r = bird.radius*bird.radius;

    // determine intersection
    if (r > d1) {
      game.currentstate = states.Score;
    }

    // Move the pipe towards left
    p.cx -= 2;
    // If pipe continues to move out of spaces
    if (p.cx < -pipe_w) {
      store.pipes.splice(0, 2); //remove first 2 pipe
    }

  })
};

export const rungame = action(function() {
    store.bird = new bird(guid(),60,0)
    store.fgpos = 0
    store.frames = 1
    store.pipes = observable([])  //Initalize to empty empty on game start
    game.currentstate= states.Game
});

export const updateFrame = action(function() {
  store.frames++;
  updateBird(store.bird);
  if (game.currentstate === states.Game) {
    store.fgpos = (store.fgpos - 2) % 14;
    fg1.cx = store.fgpos;  //Fg is observing the cx position not fgpos
    fg2.cx = store.fgpos + fg_w;
    fg3.cx = store.fgpos + fg_w*2;
    updatePipes();
  }
});
