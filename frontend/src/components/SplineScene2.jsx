import Spline from '@splinetool/react-spline';

export default function SplineScene() {
  return (
    <div className="spline-scene">
    <Spline
      style={{
        position: 'absolute',
        top: '-200px', // adjust this value to shift more or less
        left: 0,
        width: '100%',
        height: '120%',
        zIndex: 0
      }}
     scene="https://prod.spline.design/Yo86hQjYRa224jT5/scene.splinecode" />
    </div>
  );
}
