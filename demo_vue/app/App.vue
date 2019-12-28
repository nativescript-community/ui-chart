<template>
    <Page @navigatedTo="onNavigatedTo">
        <ActionBar title="Chart Samples" />
        <StackLayout>
            <ListView ref="listView" rowHeight="50" for="example in examples" @itemTap="goToExample">
                <v-template>
                    <StackLayout class="item" orientation="horizontal" height="40">
                        <Label paddingLeft="10" :text="example.title" class="title" verticalAlignment="center" />
                    </StackLayout>
                </v-template>
            </ListView>
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import BaseVueComponent from './BaseVueComponent';
import Component from 'vue-class-component';
import { getExamples } from './examples';
import { GC } from '@nativescript/core/utils/utils';

@Component({})
export default class App extends BaseVueComponent {
    onNavigatedTo() {
        console.log('app', 'onNavigatedTo');
        GC();
    }

    get examples() {
        return getExamples();
    }
    goToExample({ item }) {
        console.log('goToExample');
        this.$navigateTo(item.component);
    }
    // onItemTap(item) {
    //     const module = require(`./examples/${item.component}.vue`).default;
    //     console.log(`Tapped3 on ${item.title}, ${item.component}`, module);
    //     this.$navigateTo(module, {
    //         props: {
    //             title: item.title,
    //             description: item.description
    //         }
    //     } as any);
    // }
}
</script>

<style scoped>
ActionBar {
    background-color: #3f51b5;
    color: #ffffff;
}
</style>
