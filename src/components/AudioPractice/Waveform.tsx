type Props = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
};

export default function Waveform({ containerRef }: Props) {
  return <div ref={containerRef} />;
}
