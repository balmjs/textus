<template>
  <div class="nested-group pl-3 border-l-retro">
    <v-list-group :value="'group-' + group.id">
      <template #activator="{ props }">
        <v-list-item v-bind="props" density="compact" class="mb-1">
          <template #prepend>
            <v-icon icon="mdi-folder-outline" color="secondary" size="small" />
          </template>
          <v-list-item-title class="font-retro text-secondary text-body-2">{{
            group.name
          }}</v-list-item-title>

          <template #append v-if="isAuthenticated && !sortMode">
            <v-menu activator="parent">
              <template #activator="{ props }">
                <v-btn
                  size="x-small"
                  icon="mdi-dots-vertical"
                  variant="text"
                  color="secondary"
                  v-bind="props"
                />
              </template>

              <v-list bg-color="surface" class="border-retro">
                <v-list-item @click="$emit('edit-group', group)">
                  <v-list-item-title class="font-retro text-secondary"
                    >EDIT_FOLDER</v-list-item-title
                  >
                </v-list-item>
                <v-list-item @click="$emit('delete-group', group.id)">
                  <v-list-item-title class="font-retro text-error">DELETE_FOLDER</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('add-site', group.id)">
                  <v-list-item-title class="font-retro text-primary">ADD_SITE</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </template>

      <!-- Sites in this folder -->
      <v-list-item
        v-for="site in group.sites"
        :key="'s-' + site.id + '-' + site.url"
        :value="'nested-site-' + site.id"
        :href="site.url"
        target="_blank"
        class="site-item pl-4 mb-1"
        density="compact"
      >
        <template #prepend>
          <v-icon
            icon="mdi-subdirectory-arrow-right"
            style="color: rgba(var(--v-theme-primary), 0.5)"
            size="x-small"
            class="mr-2"
          />
          <v-avatar size="20" rounded="0">
            <v-img v-if="site.icon" :src="site.icon" />
            <v-icon v-else icon="mdi-web" size="x-small" color="primary" />
          </v-avatar>
        </template>

        <v-list-item-title class="text-caption font-retro text-primary">{{
          site.name
        }}</v-list-item-title>

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

      <!-- Nested Folders -->
      <NestedGroup
        v-for="child in group.children"
        :key="'g-' + child.id"
        :group="child"
        :sort-mode="sortMode"
        :is-authenticated="isAuthenticated"
        @edit-group="$emit('edit-group', $event)"
        @delete-group="$emit('delete-group', $event)"
        @add-site="$emit('add-site', $event)"
        @edit-site="$emit('edit-site', $event)"
        @delete-site="$emit('delete-site', $event)"
      />
    </v-list-group>
  </div>
</template>

<script setup lang="ts">
import type { GroupWithSites, Group, Site } from '@/types';

defineProps<{
  group: GroupWithSites;
  sortMode?: boolean;
  isAuthenticated: boolean;
}>();

defineEmits<{
  'edit-group': [group: Group];
  'delete-group': [id: number];
  'add-site': [groupId: number];
  'edit-site': [site: Site];
  'delete-site': [id: number];
}>();
</script>

<style scoped lang="scss">
.font-retro {
  font-family: 'Special Elite', monospace !important;
}

.border-l-retro {
  border-left: 2px dashed rgba(var(--v-theme-primary), 0.4);
  margin-left: 4px;
  padding-left: 12px;
  transition: border-color 0.3s ease;
}

.border-l-retro:hover {
  border-color: rgba(var(--v-theme-primary), 0.6);
}

.border-retro {
  border: 1px solid rgb(var(--v-theme-primary));
  transition: border-color 0.3s ease;
}

.site-item {
  transition: all 0.25s ease;
  border-left: 2px solid transparent;
  padding-left: 8px;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-left-color: rgb(var(--v-theme-secondary));
    padding-left: 12px;

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

:deep(.v-list-group__items) {
  padding: 4px 0;
}

:deep(.v-list-item) {
  transition: all 0.25s ease;
}
</style>
