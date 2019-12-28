
export class GradientColor {

    private  startColor: number;
    private  endColor: number;
    
    constructor( startColor,  endColor) {
        this.startColor = startColor;
        this.endColor = endColor;
    }

    public  getStartColor() {
        return this.startColor;
    }

    public  setStartColor( startColor) {
        this.startColor = startColor;
    }

    public  getEndColor() {
        return this.endColor;
    }

    public  setEndColor( endColor) {
        this.endColor = endColor;
    }
}
