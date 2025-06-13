export default function VideoBackground() {
  return (
    <div className="video-background">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/mobilevideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Optional: Add overlay blur/tint */}
      {/* <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10" /> */}
    </div>
  );
}
