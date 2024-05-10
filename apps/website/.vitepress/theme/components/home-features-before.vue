<template>
  <div class="vp-doc container">
    <div class="warning custom-block">
      <p class="custom-block-title">EXPERIMENTAL!</p>
      <p>
        Our toolkit is currently in active development, which means it's
        evolving rapidly with frequent changes. If you come across any bugs or
        have suggestions, please report them on
        <a
          href="https://github.com/tscpp/knuckles"
          target="_blank"
          rel="noreferrer"
          >GitHub</a
        >. If you'd like to further support its development, please consider
        <a
          href="https://github.com/sponsors/tscpp"
          target="_blank"
          rel="noreferrer"
          >sponsoring</a
        >
        the project. Thank you!
      </p>
    </div>
  </div>
</template>

<style scoped>
.container {
  margin: auto;
  width: 100%;
  max-width: 1280px;
  padding: 0 24px;
}
@media (min-width: 640px) {
  .container {
    padding: 0 48px;
  }
}
@media (min-width: 960px) {
  .container {
    width: 100%;
    padding: 0 64px;
  }
}
</style>
