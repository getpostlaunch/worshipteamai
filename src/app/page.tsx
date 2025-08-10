export default function LandingPage() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>WorshipTeamAI</h1>
      <p>Learn songs faster. Practice with loops, metronome, (soon) stems, pitch & tempo.</p>
      <p>
        <a href="/app">Go to App</a> · <a href="/login">Login</a> · <a href="/signup">Sign up</a>
      </p>
      <p>(This page is public. Only /app and /account/* are protected.)</p>
    </div>
  );
}
