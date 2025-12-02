<template>
  <v-card elevation="0" class="group-card retro-card">
    <v-card-title class="d-flex align-center justify-space-between border-b-retro py-3">
      <span class="text-h6 font-retro text-primary">{{ group.name }}</span>

      <div class="d-flex ga-1" v-if="isAuthenticated && !sortMode">
        <v-btn
          size="small"
          icon="mdi-plus"
          variant="text"
          color="primary"
          @click="$emit('add-site', group.id)"
        />

        <v-menu>
          <template #activator="{ props }">
            <v-btn
              size="small"
              icon="mdi-dots-vertical"
              variant="text"
              color="primary"
              v-bind="props"
            />
          </template>

          <v-list bg-color="#0a0a0a" class="border-retro">
            <v-list-item @click="$emit('edit', group)">
              <template #prepend>
                <v-icon icon="mdi-pencil" color="secondary" />
              </template>
              <v-list-item-title class="font-retro text-secondary">EDIT_GROUP</v-list-item-title>
            </v-list-item>

            <v-list-item @click="$emit('delete', group.id)">
              <template #prepend>
                <v-icon icon="mdi-delete" color="error" />
              </template>
              <v-list-item-title class="font-retro text-error">DELETE_GROUP</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-title>

    <v-card-text class="pa-2 bg-surface">
      <v-list density="compact" class="py-0 bg-surface">
        <!-- Direct Sites -->
        <v-list-item
          v-for="site in group.sites"
          :key="'site-' + site.id + '-' + site.url"
          :value="'site-' + site.id"
          :href="site.url"
          target="_blank"
          class="site-item rounded mb-1"
        >
          <template #prepend>
            <v-avatar size="24" rounded="0" class="mr-2 border-retro-sm">
              <v-img v-if="site.icon" :src="site.icon" />
              <v-icon v-else icon="mdi-web" color="primary" size="small" />
            </v-avatar>
          </template>

          <v-list-item-title class="font-retro text-primary">{{ site.name }}</v-list-item-title>
          <v-list-item-subtitle
            v-if="site.description"
            class="text-caption text-medium-emphasis font-retro"
          >
            {{ site.description }}
          </v-list-item-subtitle>

          <template #append v-if="isAuthenticated && !sortMode">
            <div class="site-actions hover-reveal d-flex gap-1">
              <v-btn
                size="x-small"
                icon="mdi-pencil"
                variant="text"
                color="secondary"
                class="action-btn"
                @click.prevent="$emit('edit-site', site)"
              />
              <v-btn
                size="x-small"
                icon="mdi-delete"
                variant="text"
                color="error"
                class="action-btn"
                @click.prevent="$emit('delete-site', site.id)"
              />
            </div>
          </template>
        </v-list-item>

        <!-- Nested Groups -->
        <NestedGroup
          v-for="child in group.children"
          :key="'group-' + child.id"
          :group="child"
          :sort-mode="sortMode"
          :is-authenticated="isAuthenticated"
          @edit-group="$emit('edit', $event)"
          @delete-group="$emit('delete', $event)"
          @add-site="$emit('add-site', $event)"
          @edit-site="$emit('edit-site', $event)"
          @delete-site="$emit('delete-site', $event)"
        />

        <v-list-item v-if="!group.sites.length && (!group.children || !group.children.length)">
          <v-list-item-title class="text-center text-disabled font-retro text-caption">
            [EMPTY_DATA_SLOT]
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import NestedGroup from './NestedGroup.vue';
import type { GroupWithSites, Group, Site } from '@/types';

interface Props {
  group: GroupWithSites;
  sortMode?: boolean;
}

defineProps<Props>();

defineEmits<{
  edit: [group: Group];
  delete: [id: number];
  'add-site': [groupId: number];
  'edit-site': [site: Site];
  'delete-site': [id: number];
}>();

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<style scoped lang="scss">
.font-retro {
  font-family: 'Special Elite', monospace !important;
}

.retro-card {
  background-color: rgb(var(--v-theme-surface)) !important;
  border: 2px solid rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-surface));
  /* Chamfered corners effect */
  clip-path: polygon(
    0 10px,
    10px 0,
    100% 0,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    0 100%
  );
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 20px rgba(var(--v-theme-primary), 0.08);
    pointer-events: none;
    z-index: 0;
    transition: box-shadow 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.25);
    border-color: rgb(var(--v-theme-secondary));

    &::before {
      box-shadow: inset 0 0 25px rgba(var(--v-theme-primary), 0.12);
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

.border-b-retro {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.4);
  transition: border-color 0.3s ease;
}

.border-retro {
  border: 1px solid rgb(var(--v-theme-primary));
}

.border-retro-sm {
  border: 1px solid rgba(var(--v-theme-primary), 0.6);
}

.site-item {
  transition: all 0.25s ease;
  border-left: 3px solid transparent;
  position: relative;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.12);
    border-left-color: rgb(var(--v-theme-secondary));

    .site-actions {
      opacity: 1;
      visibility: visible;
    }
  }
}

.site-actions {
  display: flex !important;
  align-items: center;
  gap: 4px;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease;
}

.action-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
}

.hover-reveal {
  transition: opacity 0.25s ease;
}
</style>
