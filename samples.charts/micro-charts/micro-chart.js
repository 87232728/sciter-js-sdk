

class Chart extends Element {
   #data = null;
   min;
   max;
   strokeWidth = 3;
   fill = Color.rgb(1,0,0,0.5);
   stroke = Color.rgb(1,0,0);

   this(props) {
      this.#data = props.data ?? this.#data; 
      this.min = props.min;
      this.max = props.max;
   }

   render() {
      return <img.chart />;
   }

   get data() { return this.#data; }
   set data(v) { this.#data = v; this.reset(); this.requestPaint(); }

   reset() {}
}


export class Line extends Chart {

   fillPath = null;
   strokePath = null;

   paintContent(gfx) {
      if(!this.strokePath && !this.fillPath) 
        this.producePaths(this.data); 
      gfx.pushLayer("padding-box");
      if(this.stroke) 
      {
        gfx.strokeStyle = this.stroke;
        gfx.strokeWidth = this.strokeWidth;
        //gfx.lineCap = "square";
        gfx.lineJoin = "miter";
        gfx.draw(this.strokePath, {x:0,y:0, stroke:true});
      }
      if(this.fill) { 
        gfx.fillStyle = this.fill;
        gfx.draw(this.fillPath, {x:0,y:0, fill:"nonzero"});
      }
      gfx.popLayer();
   }

   reset() {
     this.strokePath = null;
     this.fillPath = null;
   }


   producePaths(vals) {

      let max = this.max === undefined ? Math.max(...vals) : Math.max(...vals,this.max);
      let min = this.min === undefined ? Math.min(...vals) : Math.min(...vals,this.min);

      let [width,height] = this.state.box("dimension","inner");

      //height = height - this.strokeWidth;
      let diff = max - min;

      const xScale = input => { return input * (width / (vals.length - 1)); };
      const yScale = input => {
        var y = height;
        if (diff) y -= ((input - min) / diff) * height;
        return y + this.strokeWidth / 2
      };

      let zero = yScale(Math.max(min, 0));

      let strokePath;
      let fillPath;

      if(this.fill) { 
        fillPath = new Graphics.Path();
        fillPath.moveTo(0, zero);
      }

      if(this.stroke) { 
        strokePath = new Graphics.Path();
      }

      let i = 0;

      for (let v of vals) {
        let x = xScale(i);
        let y = yScale(v);
        if(strokePath) { i ? strokePath.lineTo(x,y) : strokePath.moveTo(x,y) };
        if(fillPath) fillPath.lineTo(x,y);
        ++i;
      }

      if(fillPath) { 
        fillPath.lineTo(width, zero);
        fillPath.close();
      }

      this.fillPath = fillPath; 
      this.strokePath = strokePath;
   }
}