<template>
  <svg
    width="40"
    height="40"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="retro-logo"
  >
    <!-- Hexagon -->
    <path
      d="M50 5 L93.3 27.5 V72.5 L50 95 L6.7 72.5 V27.5 Z"
      stroke="#33ff33"
      stroke-width="4"
      fill="rgba(51, 255, 51, 0.1)"
    />
    <!-- Text -->
    <text
      x="50"
      y="55"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="#33ff33"
      font-family="'Special Elite', monospace"
      font-size="24"
      font-weight="bold"
    >
      &lt;A/&gt;
    </text>
  </svg>
</template>

<style scoped>
.retro-logo {
  filter: drop-shadow(0 0 5px rgba(51, 255, 51, 0.5));
  animation: pulse 4s infinite ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    stroke-opacity: 1;
    fill-opacity: 0.1;
  }
  50% {
    stroke-opacity: 0.5;
    fill-opacity: 0.05;
  }
}
</style>
