import Vue from 'nativescript-vue';
import { Page } from '@nativescript/core/ui/page';
import { isAndroid, isIOS } from '@nativescript/core/platform/platform';
// import { CartoMap } from 'nativescript-carto/ui/ui';

export default class BaseVueComponent extends Vue {
    public isAndroid = isAndroid;
    public isIOS = isIOS;
    get page() {
        return (this.$refs.page as any).nativeView as Page;
    }
    // get mapView() {
    //     return (this.$refs.mapView as any).nativeView as CartoMap;
    // }
    mounted() {
    }
}
