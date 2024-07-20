import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {
  Observable,
  animationFrameScheduler,
  interval,
  map,
  startWith,
} from 'rxjs';
// @ts-ignore
import shaka from 'shaka-player';

@Component({
  selector: 'shaka-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <video #videoPlayer
  width="640"
  controls
></video>
<button (click)="surround()">surround</button>
<button (click)="stereo()">stereo</button>
<div *ngIf="levels$ | async as levels">
<div>ch1:{{levels[0]}}</div>
<div>ch2:{{levels[1]}}</div>
<div>ch3:{{levels[2]}}</div>
<div>ch4:{{levels[3]}}</div>
<div>ch5:{{levels[4]}}</div>
<div>ch6:{{levels[5]}}</div>
</div>
  `,
})
export class ShakaPlayerComponent implements AfterViewInit {
  @ViewChild('videoPlayer') videoElementRef?: ElementRef;
  private videoElement?: HTMLMediaElement;
  private manifestUri =
    'https://storage.googleapis.com/shaka-demo-assets/tos-surround/dash.mpd';
  private player: shaka.Player;
  levels$?: Observable<number[]>;

  ngAfterViewInit() {
    shaka.polyfill.installAll();
    this.videoElement = this.videoElementRef?.nativeElement;
    this.player = new shaka.Player(this.videoElement);
    this.player.load(this.manifestUri);
    this.setupWebAudioPipeline();
  }

  public surround() {
    const tracks = this.player.getVariantTracks();
    this.player.selectVariantTrack(
      // @ts-ignore
      tracks.find((t) => t.channelsCount === 6),
      true
    );
  }

  public stereo() {
    const tracks = this.player.getVariantTracks();
    this.player.selectVariantTrack(
      // @ts-ignore
      tracks.find((t) => t.channelsCount === 2),
      true
    );
  }

  private setupWebAudioPipeline(): void {
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(
      this.videoElement!
    );
    const audioChannelSplitter = audioContext.createChannelSplitter(6);
    sourceNode.connect(audioChannelSplitter);
    const analysers: AnalyserNode[] = Array(6)
      .fill(null)
      .map((_, i) => {
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -100;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 32;
        audioChannelSplitter.connect(analyser, i, 0);
        return analyser;
      });

    const freqData = new Uint8Array(analysers[0].frequencyBinCount);
    this.levels$ = interval(1000 / 60, animationFrameScheduler).pipe(
      startWith(null),
      map(() => {
        return analysers.map((a) => {
          a.getByteFrequencyData(freqData);
          return Math.max(...freqData) / 256;
        });
      })
    );
  }
}
