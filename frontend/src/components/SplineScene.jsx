export default function VideoBackground() {
  return (
    <div className="video-background z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/desktopvideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Optional: Add overlay blur/tint */}
      {/* <div className="absolute inset-0 backdrop-blur-sm z-1" /> */}
    </div>
  );
}
