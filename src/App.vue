<template>
  <v-app>
    <v-app-bar
      elevation="1"
      color="surface"
      density="compact"
      class="app-bar-retro"
      style="border-bottom: 2px solid rgb(var(--v-theme-primary))"
    >
      <v-app-bar-title>
        <router-link to="/" class="site-title-link">
          <span
            class="text-h6 font-weight-bold text-primary site-title"
            style="font-family: 'Special Elite', monospace; letter-spacing: 2px"
            >TEXTUS</span
          >
        </router-link>
      </v-app-bar-title>

      <template #append>
        <!-- GitHub Logo Link -->
        <v-btn
          icon
          variant="text"
          href="https://github.com/balmjs/textus"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub"
          class="github-logo-btn"
        >
          <v-icon icon="mdi-github" size="24" />
        </v-btn>

        <!-- Add Group Button (only for authenticated users) -->
        <v-btn
          v-if="authStore.isAuthenticated"
          icon="mdi-plus"
          @click="emitAddGroup"
          variant="text"
          title="Add Group"
        />

        <!-- Data Menu (Import/Export) -->
        <v-menu v-if="authStore.isAuthenticated">
          <template #activator="{ props }">
            <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props" />
          </template>

          <v-list class="toolbar-menu">
            <v-list-item @click="emitExport" class="menu-item">
              <template #prepend>
                <v-icon icon="mdi-export" color="primary" />
              </template>
              <v-list-item-title class="text-primary font-retro">EXPORT</v-list-item-title>
            </v-list-item>

            <v-divider />

            <v-list-item @click="emitImport" class="menu-item">
              <template #prepend>
                <v-icon icon="mdi-import" color="primary" />
              </template>
              <v-list-item-title class="text-primary font-retro">IMPORT</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Settings Button (only for authenticated users) -->
        <v-btn
          v-if="authStore.isAuthenticated"
          icon="mdi-cog"
          @click="showSettings = true"
          variant="text"
          title="Settings"
        />

        <!-- Theme Toggle -->
        <v-btn
          icon="mdi-brightness-6"
          @click="toggleTheme"
          class="theme-toggle-btn"
          variant="text"
          title="Toggle Theme"
        />

        <!-- Logout Button (only for authenticated users) -->
        <v-btn
          v-if="authStore.isAuthenticated"
          icon="mdi-logout"
          @click="handleLogout"
          variant="text"
          title="Logout"
        />
      </template>
    </v-app-bar>

    <v-main>
      <router-view :key="viewKey" />
    </v-main>

    <v-footer
      app
      color="background"
      class="footer-retro d-flex justify-center align-center text-caption py-3"
      style="border-top: 2px solid rgb(var(--v-theme-primary)); min-height: 48px"
    >
      <div class="typewriter-container" style="font-family: 'Special Elite', monospace">
        <span class="text-primary">{{ displayedText }}</span>
        <span class="text-secondary">{{ displayedHighlight }}</span>
        <span v-if="isTyping" class="text-primary cursor" style="animation: blink 1s infinite"
          >|</span
        >
      </div>
    </v-footer>

    <v-overlay
      :model-value="loadingStore.isLoading"
      persistent
      z-index="2500"
      class="loading-overlay d-flex align-center justify-center"
    >
      <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <SettingsDialog v-model="showSettings" />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, reactive, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useLoadingStore } from '@/stores/loading';
import { useNavigationStore } from '@/stores/navigation';
import { useRouter } from 'vue-router';
import SettingsDialog from '@/components/SettingsDialog.vue';
import { initializeSEO, updateAllSEOMeta } from '@/utils/seo';
import { slogans } from '@/config';

const theme = useTheme();
const authStore = useAuthStore();
const loadingStore = useLoadingStore();
const navStore = useNavigationStore();
const router = useRouter();
const showSettings = ref(false);
const viewKey = ref(0); // 用于强制重新渲染router-view

const currentSlogan = ref(slogans[0]);
const displayedText = ref('');
const displayedHighlight = ref('');
const isTyping = ref(false);

// Event handlers for toolbar actions - use reactive instead of ref for better performance
const toolbarEvents = reactive({
  addGroup: null as (() => void) | null,
  export: null as (() => void) | null,
  import: null as (() => void) | null,
});

// 初始化 SEO
const initSEO = async () => {
  await navStore.loadConfigs();

  const siteTitle = navStore.configs.siteTitle || 'Textus';
  const siteDescription =
    navStore.configs.siteDescription ||
    'Textus is the true successor to browser bookmarks. Beautiful, shareable, cloud-powered visual startpages that finally replace the chaotic 30-year-old bookmark system.';
  const siteKeywords =
    navStore.configs.siteKeywords ||
    'Textus, bookmark alternative, visual bookmarks, startpage, personal dashboard, aesthetic homepage, link in bio, bookmark manager 2.0, new tab page';

  // Get the absolute URL for the logo
  const logoUrl = `${window.location.origin}/textus.svg`;

  initializeSEO({
    title: siteTitle,
    description: siteDescription,
    keywords: siteKeywords,
    image: logoUrl,
    url: window.location.origin,
    author: 'Textus',
  });
};

// 监听配置变化，动态更新 SEO
watch(
  () => navStore.configs,
  (newConfigs) => {
    if (newConfigs.siteTitle || newConfigs.siteDescription || newConfigs.siteKeywords) {
      const logoUrl = `${window.location.origin}/textus.svg`;

      updateAllSEOMeta({
        title: newConfigs.siteTitle || 'Textus',
        description:
          newConfigs.siteDescription ||
          'Textus is the true successor to browser bookmarks. Beautiful, shareable, cloud-powered visual startpages that finally replace the chaotic 30-year-old bookmark system.',
        keywords:
          newConfigs.siteKeywords ||
          'Textus, bookmark alternative, visual bookmarks, startpage, personal dashboard, aesthetic homepage, link in bio, bookmark manager 2.0, new tab page',
        image: logoUrl,
        url: window.location.origin,
      });
    }
  },
  { deep: true }
);

// 加载保存的主题和初始化 SEO
onMounted(async () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.change(savedTheme);
  }

  // 初始化 SEO
  await initSEO();

  // 启动打字机效果
  typeWriter();
});

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? 'light' : 'dark';
  theme.change(newTheme);
  localStorage.setItem('theme', newTheme);
  viewKey.value++; // 强制重新渲染以应用主题变化
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Emit toolbar actions
const emitAddGroup = () => {
  if (toolbarEvents.addGroup) {
    toolbarEvents.addGroup();
  }
};

const emitExport = () => {
  if (toolbarEvents.export) {
    toolbarEvents.export();
  }
};

const emitImport = () => {
  if (toolbarEvents.import) {
    toolbarEvents.import();
  }
};

// Provide the toolbar event registration
provide('toolbar-events', toolbarEvents);

// 打字机效果函数
const typeWriter = async () => {
  if (isTyping.value) return;

  isTyping.value = true;
  displayedText.value = '';
  displayedHighlight.value = '';

  // 随机选择一条文案
  const randomIndex = Math.floor(Math.random() * slogans.length);
  currentSlogan.value = slogans[randomIndex];

  // 打字效果
  const fullText = currentSlogan.value.text + currentSlogan.value.highlight;
  let charIndex = 0;

  const typeChar = () => {
    if (charIndex < fullText.length) {
      if (charIndex < currentSlogan.value.text.length) {
        displayedText.value += fullText[charIndex];
      } else {
        displayedHighlight.value += fullText[charIndex];
      }
      charIndex++;
      setTimeout(typeChar, 50 + Math.random() * 50); // 随机打字速度
    } else {
      isTyping.value = false;
      // 5秒后重新开始
      setTimeout(typeWriter, 5000);
    }
  };

  typeChar();
};
</script>

<style scoped lang="scss">
.app-bar-retro {
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.footer-retro {
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.theme-toggle-btn {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: rotate(180deg) scale(1.1);
  }
}

:deep(.v-btn) {
  transition: all 0.25s ease;

  &:hover {
    transform: scale(1.1);
  }
}

:deep(.loading-overlay) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.toolbar-menu) {
  background-color: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  transition: all 0.25s ease;
}

:deep(.toolbar-menu .menu-item) {
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
  }
}

:deep(.toolbar-menu .v-divider) {
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.font-retro {
  font-family: 'Special Elite', monospace !important;
}

.github-logo-btn {
  transition: all 0.25s ease;

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
}

.site-title-link {
  text-decoration: none;
  display: inline-block;
}

.site-title {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(var(--v-theme-primary), 0.3),
        rgba(var(--v-theme-primary), 0.6),
        rgba(var(--v-theme-primary), 0.3),
        transparent
      );
      animation: shimmer 0.6s ease-out;
      z-index: 1;
    }
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.typewriter-container {
  display: inline-block;
  text-align: center;

  .cursor {
    display: inline-block;
    width: 2px;
    margin-left: 2px;
  }
}
</style>
