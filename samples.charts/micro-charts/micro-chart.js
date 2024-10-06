class Chart extends Element {
   data = null;
   min;
   max;

   this(props) {
      this.data = props.data ?? this.data; 
      this.min = props.min;
      this.max = props.max;
   }

   render() {
      return <img.chart />;
   }

   get value() { return this.data; }
   set value(v) { this.data = v; this.reset(); this.requestPaint(); }

   reset() {}
}

export class Line extends Chart {

   fillPath = null;
   strokePath = null;

   strokeWidth = 3;
   fill; // Color
   stroke; // Color

   this(props) {
      super.this(props);
      if(props.fill || props.color) {
        this.fill = props.fill;
        this.stroke = props.color;
      } else 
        this.stroke = props.color ?? Color.rgb(1,0,0);
      this.strokeWidth = this.thickness ?? 2;
   }

   paintContent(gfx) {
      const [fillPath, strokePath] = this.producePaths(this.data); 
      gfx.pushLayer("content-box");
      gfx.lineJoin = "miter";
      if(this.stroke) 
      {
        gfx.strokeStyle = this.stroke;
        gfx.strokeWidth = this.strokeWidth;
        gfx.draw(strokePath, {x:0,y:0, stroke:true});
      }
      if(this.fill) { 
        gfx.fillStyle = this.fill;
        gfx.draw(fillPath, {x:0,y:0, fill:"nonzero"});
      }
      gfx.popLayer();
   }

   reset() {
     this.strokePath = null;
     this.fillPath = null;
   }

   producePaths(vals) {

      if(this.fillPath || this.strokePath)
        return [this.fillPath,this.strokePath];

      let max = this.max ?? Math.max(...vals);
      let min = this.min ?? Math.min(...vals);

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
      return [fillPath,strokePath];
   }
}

const radians360 = Math.PI * 2;
const radians90 = Math.PI / 2;

export class Pie extends Chart {

  _paths = null;
  _colors = null;

  this(props) {
    super.this(props);
    this._colors = props.colors; 
  }

  get isSingleValue() // true if this.data is a single value - not an array  
  {
    return !Array.isArray(this.data);
  }

  get values() {
    if(this.isSingleValue) {
      let max = this.max ?? 1.0;
      return [this.data, max - this.data];
    } else 
      return this.data;
  }
  get colors() {
    return Array.isArray(this._colors)
      ? this._colors
      : ["#B80000",/*"#DB3E00",*/"#FCCB00","#008B02","#006B76","#1273DE","#004DCF","#5300EB"];
  }

  get sectors() { // returns sector angles
    const vals = this.values;
    let sum = 0;  for (const val of vals) sum += val;
    let angles = [];
    for (const value of vals) {
      let angle = value / sum * radians360;
      angles.push(angle);
    }
    return angles;
  }

  get paths() { 

    if(this._paths) return this._paths;

    const sectors = this.sectors;
    const colors = this.colors;
    const paths = [];    
    let start = -radians90;

    let [width,height] = this.state.box("dimension","inner");
    let cx = width / 2, cy = height / 2;
    let radius = Math.min(cx, cy);

    for (const angle of sectors) {
      const end = start + angle;
      const path = new Graphics.Path();
      path.moveTo(cx, cy);
      if(start < end) path.arc(cx, cy, radius, start, end);
      path.close();
      path.color = Color(colors[paths.length % colors.length]);
      paths.push(path);
      start = end;
    }
    return this._paths = paths; 
  }

  paintContent(gfx) {
    
    gfx.pushLayer("content-box");
    for(const path of this.paths) {
      gfx.fillStyle = path.color;
      gfx.draw(path, {x:0,y:0, fill:"nonzero"});
    }
    gfx.popLayer();
  }

  reset() {
    this._paths = null;
  }

}

export class Donut extends Pie {
  thickness = 0.4;

  this(props) {
    super.this(props);
    this.thickness = props.thickness ?? 0.4; 
  }

  get paths() { 

    if(this._paths) return this._paths;

    const sectors = this.sectors;
    const colors = this.colors;
    const paths = [];    
    let start = -radians90;

    let [width,height] = this.state.box("dimension","inner");
    let cx = width / 2, cy = height / 2;

    let radius = Math.min(cx, cy);
    let innerRadius = radius - this.thickness * radius;

    for (const angle of sectors) {
      const end = start + angle;
      const path = new Graphics.Path();
      if(start < end) {
        path.arc(cx, cy, radius, start, end);
        path.arc(cx, cy, innerRadius, end, start, true);
      }
      path.color = Color(colors[paths.length % colors.length]);
      paths.push(path);
      start = end;
    }
    return this._paths = paths; 
  }

  paintContent(gfx) {
    const paths = this.paths;
    for(const path of paths) {
      gfx.fillStyle = path.color;
      gfx.draw(path, {x:0,y:0, fill:"nonzero"});
    }
  }
}

export class Bars extends Chart {

  _paths = null;
  _colors = null;

  thickness = 1;

  this(props) {
    super.this(props);
    this._colors = props.colors; 
    this.thickness = Math.min(props.thickness ?? 1, 1.0);
  }

  get colors() {
    return Array.isArray(this._colors) ? this._colors : ["#B80000"];
  }  

  get paths() {

    if(this._paths) return this._paths;

    const vals = this.data;
    const max = this.max ?? Math.max(...vals);
    const min = this.min ?? Math.min(...vals);

    const colors = this.colors;
    const paths = [];    

    const [width,height] = this.state.box("dimension","inner");

    const diff = max - min;

    //function xScale(input) { return input * width / vals.length };
    function yScale(input) { return height - ( diff ? ((input - min) / diff) * height: 1 ) };

    let w = width / vals.length * this.thickness;
    let spacing = (width - w * vals.length) / (Math.max(vals.length,1) - 1);

    let x = 0;

    for (let val of vals) 
    {
      let valY = yScale(val);
      let y1 = valY, y2 = valY, h;

      if (val < 0) y1 = yScale(Math.min(max, 0.0));
              else y2 = yScale(Math.max(min, 0.0));

      h = y2 - y1;
      if (h == 0) { h = 1; if (max > 0 && diff) --y1; }

      const path = new Graphics.Path();
      path.rect(x, y1, w, h);
      path.color = Color(colors[paths.length % colors.length]);

      paths.push(path);
      x += w + spacing;
    }

    return this._paths = paths;     
  }

  paintContent(gfx) {
    gfx.pushLayer("content-box");
    for(const path of this.paths) {
      gfx.fillStyle = path.color;
      gfx.draw(path, {x:0,y:0, fill:"nonzero"});
    }
    gfx.popLayer();
  }

  reset() {
    this._paths = null;
  }

}
