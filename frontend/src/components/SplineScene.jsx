import Spline from '@splinetool/react-spline';

export default function SplineScene() {
  return (
    <div className='spline-scene'>
        <Spline
        style={{ position:'absolute',top:0, left:0, width: '100%', height: '100%' }}
        scene="https://prod.spline.design/PYop-g4IX840opNh/scene.splinecode" />
    </div>
  );
}
