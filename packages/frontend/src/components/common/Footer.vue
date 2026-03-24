<template>
  <footer class="bg-gray-900 text-gray-400 text-sm mt-auto">
    <div
      class="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <p>
        &copy; {{ new Date().getFullYear() }} Ministros FC. Todos los derechos
        reservados.
      </p>
      <div class="flex items-center gap-6">
        <NuxtLink to="/roster" class="hover:text-white transition-colors"
          >Plantilla</NuxtLink
        >
        <NuxtLink to="/schedule" class="hover:text-white transition-colors"
          >Calendario</NuxtLink
        >
        <NuxtLink to="/statistics" class="hover:text-white transition-colors"
          >Estadísticas</NuxtLink
        >
      </div>
    </div>
  </footer>
</template>
