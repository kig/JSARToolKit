/*
 * JSARToolkit
 * --------------------------------------------------------------------------------
 * This work is based on the original ARToolKit developed by
 *   Hirokazu Kato
 *   Mark Billinghurst
 *   HITLab, University of Washington, Seattle
 * http://www.hitl.washington.edu/artoolkit/
 *
 * And the NyARToolkitAS3 ARToolKit class library.
 *   Copyright (C)2010 Ryo Iizuka
 *
 * JSARToolkit is a JavaScript port of NyARToolkitAS3.
 *   Copyright (C)2010 Ilmari Heikkinen
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * For further information please contact.
 *  ilmari.heikkinen@gmail.com
 *
 */


NyARMath = Klass(
{
  /**
   * p2-p1ベクトルのsquare normを計算する。
   * @param i_p1
   * @param i_p2
   * @return
   */
  sqNorm_NyARDoublePoint2d : function(i_p1,i_p2 )
  {
    var x,y;
    x=i_p2.x-i_p1.x;
    y=i_p2.y-i_p1.y;
    return x*x+y*y;
  },
  sqNorm_Number : function(i_p1x,i_p1y,i_p2x,i_p2y)
  {
    var x,y;
    x=i_p2x-i_p1x;
    y=i_p2y-i_p1y;
    return x*x+y*y;
  },
  /**
   * p2-p1ベクトルのsquare normを計算する。
   * @param i_p1
   * @param i_p2
   * @return
   */
  sqNorm_NyARDoublePoint3d : function(i_p1,i_p2)
  {
    var x, y, z;
    x=i_p2.x-i_p1.x;
    y=i_p2.y-i_p1.y;
    z=i_p2.z-i_p1.z;
    return x*x+y*y+z*z;
  },
  /**
   * 3乗根を求められないシステムで、３乗根を求めます。
   * http://aoki2.si.gunma-u.ac.jp/JavaScript/src/3jisiki.html
   * @param i_in
   * @return
   */
  cubeRoot : function(i_in)
  {
    var res = Math.pow(Math.abs(i_in), 1.0 / 3.0);
    return (i_in >= 0) ? res : -res;
  }
})


NyAREquationSolver = Klass(
{
  solve2Equation_3 : function(i_a, i_b,i_c,o_result)
  {
    NyAS3Utils.assert(i_a!=0);
    return this.solve2Equation_2b(i_b/i_a,i_c/i_a,o_result,0);
  },
  solve2Equation_2a : function(i_b, i_c,o_result)
  {
    return this.solve2Equation_2b(i_b,i_c,o_result,0);
  },
  solve2Equation_2b : function(i_b, i_c,o_result,i_result_st)
  {
    var t=i_b*i_b-4*i_c;
    if(t<0){
      //虚数根
      return 0;
    }
    if(t==0){
      //重根
      o_result[i_result_st+0]=-i_b/(2);
      return 1;
    }
    //実根２個
    t=Math.sqrt(t);
    o_result[i_result_st+0]=(-i_b+t)/(2);
    o_result[i_result_st+1]=(-i_b-t)/(2);
    return 2;
  },
  /**
   * ３次方程式 a*x^3+b*x^2+c*x+d=0の実根を求める。
   * http://aoki2.si.gunma-u.ac.jp/JavaScript/src/3jisiki.html
   * のコードを基にしてます。
   * @param i_a
   * X^3の係数
   * @param i_b
   * X^2の係数
   * @param i_c
   * X^1の係数
   * @param i_d
   * X^0の係数
   * @param o_result
   * 実根。double[3]を指定すること。
   * @return
   */
  solve3Equation_4 : function(i_a, i_b, i_c, i_d,o_result)
  {
    NyAS3Utils.assert (i_a != 0);
    return this.solve3Equation_3(i_b/i_a,i_c/i_a,i_d/i_a,o_result);
  },
  /**
   * ３次方程式 x^3+b*x^2+c*x+d=0の実根を求める。
   * だけを求める。
   * http://aoki2.si.gunma-u.ac.jp/JavaScript/src/3jisiki.html
   * のコードを基にしてます。
   * @param i_b
   * X^2の係数
   * @param i_c
   * X^1の係数
   * @param i_d
   * X^0の係数
   * @param o_result
   * 実根。double[1]以上を指定すること。
   * @return
   */
  solve3Equation_3 : function(i_b,i_c,i_d,o_result)
  {
    var tmp,b,   p, q;
    b = i_b/(3);
    p = b * b - i_c / 3;
    q = (b * (i_c - 2 * b * b) - i_d) / 2;
    if ((tmp = q * q - p * p * p) == 0) {
      // 重根
      q = NyARMath.cubeRoot(q);
      o_result[0] = 2 * q - b;
      o_result[1] = -q - b;
      return 2;
    } else if (tmp > 0) {
      // 実根1,虚根2
      var a3 = NyARMath.cubeRoot(q + ((q > 0) ? 1 : -1) * Math.sqrt(tmp));
      var b3 = p / a3;
      o_result[0] = a3 + b3 - b;
      // 虚根:-0.5*(a3+b3)-b,Math.abs(a3-b3)*Math.sqrt(3.0)/2
      return 1;
    } else {
      // 実根3
      tmp = 2 * Math.sqrt(p);
      var t = Math.acos(q / (p * tmp / 2));
      o_result[0] = tmp * Math.cos(t / 3) - b;
      o_result[1] = tmp * Math.cos((t + 2 * Math.PI) / 3) - b;
      o_result[2] = tmp * Math.cos((t + 4 * Math.PI) / 3) - b;
      return 3;
    }
  },
  /**
   * ４次方程式の実根だけを求める。
   * @param i_a
   * X^3の係数
   * @param i_b
   * X^2の係数
   * @param i_c
   * X^1の係数
   * @param i_d
   * X^0の係数
   * @param o_result
   * 実根。double[3]を指定すること。
   * @return
   */
  solve4Equation : function(i_a, i_b, i_c, i_d,i_e,o_result)
  {
    NyAS3Utils.assert (i_a != 0);
    var A3,A2,A1,A0,B3;
    A3=i_b/i_a;
    A2=i_c/i_a;
    A1=i_d/i_a;
    A0=i_e/i_a;
    B3=A3/4;
    var p,q,r;
    var B3_2=B3*B3;
    p=A2-6*B3_2;//A2-6*B3*B3;
    q=A1+B3*(-2*A2+8*B3_2);//A1-2*A2*B3+8*B3*B3*B3;
    r=A0+B3*(-A1+A2*B3)-3*B3_2*B3_2;//A0-A1*B3+A2*B3*B3-3*B3*B3*B3*B3;
    if(q==0){
      var result_0,result_1;
      //複二次式
      var res=this.solve2Equation_2b(p,r,o_result,0);
      switch(res){
      case 0:
        //全て虚数解
        return 0;
      case 1:
        //重根
        //解は0,1,2の何れか。
        result_0=o_result[0];
        if(result_0<0){
          //全て虚数解
          return 0;
        }
        //実根1個
        if(result_0==0){
          //NC
          o_result[0]=0-B3;
          return 1;
        }
        //実根2個
        result_0=Math.sqrt(result_0);
        o_result[0]=result_0-B3;
        o_result[1]=-result_0-B3;
        return 2;
      case 2:
        //実根２個だからt==t2==0はありえない。(case1)
        //解は、0,2,4の何れか。
        result_0=o_result[0];
        result_1=o_result[1];
        var number_of_result=0;
        if(result_0>0){
          //NC
          result_0=Math.sqrt(result_0);
          o_result[0]= result_0-B3;
          o_result[1]=-result_0-B3;
          number_of_result+=2;
        }
        if(result_1>0)
        {
          //NC
          result_1=Math.sqrt(result_1);
          o_result[number_of_result+0]= result_1-B3;
          o_result[number_of_result+1]=-result_1-B3;
          number_of_result+=2;
        }
        return number_of_result;
      default:
        throw new NyARException();
      }
    }else{
      //それ以外
      //最適化ポイント:
      //u^3  + (2*p)*u^2  +((- 4*r)+(p^2))*u -q^2= 0
      var u=this.solve3Equation_1((2*p),(- 4*r)+(p*p),-q*q);
      if(u<0){
        //全て虚数解
        return 0;
      }
      var ru=Math.sqrt(u);
      //2次方程式を解いてyを計算(最適化ポイント)
      var result_1st,result_2nd;
      result_1st=this.solve2Equation_2b(-ru,(p+u)/2+ru*q/(2*u),o_result,0);
      //配列使い回しのために、変数に退避
      switch(result_1st){
      case 0:
        break;
      case 1:
        o_result[0]=o_result[0]-B3;
        break;
      case 2:
        o_result[0]=o_result[0]-B3;
        o_result[1]=o_result[1]-B3;
        break;
      default:
        throw new NyARException();
      }
      result_2nd=this.solve2Equation_2b(ru,(p+u)/2-ru*q/(2*u),o_result,result_1st);
      //0,1番目に格納
      switch(result_2nd){
      case 0:
        break;
      case 1:
        o_result[result_1st+0]=o_result[result_1st+0]-B3;
        break;
      case 2:
        o_result[result_1st+0]=o_result[result_1st+0]-B3;
        o_result[result_1st+1]=o_result[result_1st+1]-B3;
        break;
      default:
        throw new NyARException();
      }
      return result_1st+result_2nd;
    }
  },
  /**
   * 3次方程式の実根を１個だけ求める。
   * 4字方程式で使う。
   * @param i_b
   * @param i_c
   * @param i_d
   * @param o_result
   * @return
   */
  solve3Equation_1 : function(i_b,i_c, i_d)
  {
    var tmp,b,   p, q;
    b = i_b/(3);
    p = b * b - i_c / 3;
    q = (b * (i_c - 2 * b * b) - i_d) / 2;
    if ((tmp = q * q - p * p * p) == 0) {
      // 重根
      q = NyARMath.cubeRoot(q);
      return 2 * q - b;
    } else if (tmp > 0) {
      // 実根1,虚根2
      var a3 = NyARMath.cubeRoot(q + ((q > 0) ? 1 : -1) * Math.sqrt(tmp));
      var b3 = p / a3;
      return a3 + b3 - b;
    } else {
      // 実根3
      tmp = 2 * Math.sqrt(p);
      var t = Math.acos(q / (p * tmp / 2));
      return tmp * Math.cos(t / 3) - b;
    }
  }
})

NyARPerspectiveParamGenerator_O1 = Klass(
{
  _local_x : 0,
  _local_y : 0,
  _width : 0,
  _height : 0,
  initialize : function(i_local_x,i_local_y,i_width,i_height)
  {
    this._height=i_height;
    this._width=i_width;
    this._local_x=i_local_x;
    this._local_y=i_local_y;
    return;
  },
  getParam : function(i_vertex,o_param)
  {
    var ltx = this._local_x;
    var lty = this._local_y;
    var rbx = ltx + this._width;
    var rby = lty + this._height;
    var det_1;
    var a13, a14, a23, a24, a33, a34, a43, a44;
    var b11, b12, b13, b14, b21, b22, b23, b24, b31, b32, b33, b34, b41, b42, b43, b44;
    var t1, t2, t3, t4, t5, t6;
    var v1, v2, v3, v4;
    var kx0, kx1, kx2, kx3, kx4, kx5, kx6, kx7;
    var ky0, ky1, ky2, ky3, ky4, ky5, ky6, ky7;
    {
      v1 = i_vertex[0].x;
      v2 = i_vertex[1].x;
      v3 = i_vertex[2].x;
      v4 = i_vertex[3].x;
      a13 = -ltx * v1;
      a14 = -lty * v1;
      a23 = -rbx * v2;
      a24 = -lty * v2;
      a33 = -rbx * v3;
      a34 = -rby * v3;
      a43 = -ltx * v4;
      a44 = -rby * v4;
      t1 = a33 * a44 - a34 * a43;
      t4 = a34 * ltx - rbx * a44;
      t5 = rbx * a43 - a33 * ltx;
      t2 = rby * (a34 - a44);
      t3 = rby * (a43 - a33);
      t6 = rby * (rbx - ltx);
      b21 = -a23 * t4 - a24 * t5 - rbx * t1;
      b11 = (a23 * t2 + a24 * t3) + lty * t1;
      b31 = (a24 * t6 - rbx * t2) + lty * t4;
      b41 = (-rbx * t3 - a23 * t6) + lty * t5;
      t1 = a43 * a14 - a44 * a13;
      t2 = a44 * lty - rby * a14;
      t3 = rby * a13 - a43 * lty;
      t4 = ltx * (a44 - a14);
      t5 = ltx * (a13 - a43);
      t6 = ltx * (lty - rby);
      b12 = -rby * t1 - a33 * t2 - a34 * t3;
      b22 = (a33 * t4 + a34 * t5) + rbx * t1;
      b32 = (-a34 * t6 - rby * t4) + rbx * t2;
      b42 = (-rby * t5 + a33 * t6) + rbx * t3;
      t1 = a13 * a24 - a14 * a23;
      t4 = a14 * rbx - ltx * a24;
      t5 = ltx * a23 - a13 * rbx;
      t2 = lty * (a14 - a24);
      t3 = lty * (a23 - a13);
      t6 = lty * (ltx - rbx);
      b23 = -a43 * t4 - a44 * t5 - ltx * t1;
      b13 = (a43 * t2 + a44 * t3) + rby * t1;
      b33 = (a44 * t6 - ltx * t2) + rby * t4;
      b43 = (-ltx * t3 - a43 * t6) + rby * t5;
      t1 = a23 * a34 - a24 * a33;
      t2 = a24 * rby - lty * a34;
      t3 = lty * a33 - a23 * rby;
      t4 = rbx * (a24 - a34);
      t5 = rbx * (a33 - a23);
      t6 = rbx * (rby - lty);
      b14 = -lty * t1 - a13 * t2 - a14 * t3;
      b24 = a13 * t4 + a14 * t5 + ltx * t1;
      b34 = -a14 * t6 - lty * t4 + ltx * t2;
      b44 = -lty * t5 + a13 * t6 + ltx * t3;
      det_1 = (ltx * (b11 + b14) + rbx * (b12 + b13));
      if (det_1 == 0) {
        det_1=0.0001;
        //System.out.println("Could not get inverse matrix(1).");
        //return false;
      }
      det_1 = 1 / det_1;
      kx0 = (b11 * v1 + b12 * v2 + b13 * v3 + b14 * v4) * det_1;
      kx1 = (b11 + b12 + b13 + b14) * det_1;
      kx2 = (b21 * v1 + b22 * v2 + b23 * v3 + b24 * v4) * det_1;
      kx3 = (b21 + b22 + b23 + b24) * det_1;
      kx4 = (b31 * v1 + b32 * v2 + b33 * v3 + b34 * v4) * det_1;
      kx5 = (b31 + b32 + b33 + b34) * det_1;
      kx6 = (b41 * v1 + b42 * v2 + b43 * v3 + b44 * v4) * det_1;
      kx7 = (b41 + b42 + b43 + b44) * det_1;
    }
    {
      v1 = i_vertex[0].y;
      v2 = i_vertex[1].y;
      v3 = i_vertex[2].y;
      v4 = i_vertex[3].y;
      a13 = -ltx * v1;
      a14 = -lty * v1;
      a23 = -rbx * v2;
      a24 = -lty * v2;
      a33 = -rbx * v3;
      a34 = -rby * v3;
      a43 = -ltx * v4;
      a44 = -rby * v4;
      t1 = a33 * a44 - a34 * a43;
      t4 = a34 * ltx - rbx * a44;
      t5 = rbx * a43 - a33 * ltx;
      t2 = rby * (a34 - a44);
      t3 = rby * (a43 - a33);
      t6 = rby * (rbx - ltx);
      b21 = -a23 * t4 - a24 * t5 - rbx * t1;
      b11 = (a23 * t2 + a24 * t3) + lty * t1;
      b31 = (a24 * t6 - rbx * t2) + lty * t4;
      b41 = (-rbx * t3 - a23 * t6) + lty * t5;
      t1 = a43 * a14 - a44 * a13;
      t2 = a44 * lty - rby * a14;
      t3 = rby * a13 - a43 * lty;
      t4 = ltx * (a44 - a14);
      t5 = ltx * (a13 - a43);
      t6 = ltx * (lty - rby);
      b12 = -rby * t1 - a33 * t2 - a34 * t3;
      b22 = (a33 * t4 + a34 * t5) + rbx * t1;
      b32 = (-a34 * t6 - rby * t4) + rbx * t2;
      b42 = (-rby * t5 + a33 * t6) + rbx * t3;
      t1 = a13 * a24 - a14 * a23;
      t4 = a14 * rbx - ltx * a24;
      t5 = ltx * a23 - a13 * rbx;
      t2 = lty * (a14 - a24);
      t3 = lty * (a23 - a13);
      t6 = lty * (ltx - rbx);
      b23 = -a43 * t4 - a44 * t5 - ltx * t1;
      b13 = (a43 * t2 + a44 * t3) + rby * t1;
      b33 = (a44 * t6 - ltx * t2) + rby * t4;
      b43 = (-ltx * t3 - a43 * t6) + rby * t5;
      t1 = a23 * a34 - a24 * a33;
      t2 = a24 * rby - lty * a34;
      t3 = lty * a33 - a23 * rby;
      t4 = rbx * (a24 - a34);
      t5 = rbx * (a33 - a23);
      t6 = rbx * (rby - lty);
      b14 = -lty * t1 - a13 * t2 - a14 * t3;
      b24 = a13 * t4 + a14 * t5 + ltx * t1;
      b34 = -a14 * t6 - lty * t4 + ltx * t2;
      b44 = -lty * t5 + a13 * t6 + ltx * t3;
      det_1 = (ltx * (b11 + b14) + rbx * (b12 + b13));
      if (det_1 == 0) {
        det_1=0.0001;
        //System.out.println("Could not get inverse matrix(2).");
        //return false;
      }
      det_1 = 1 / det_1;
      ky0 = (b11 * v1 + b12 * v2 + b13 * v3 + b14 * v4) * det_1;
      ky1 = (b11 + b12 + b13 + b14) * det_1;
      ky2 = (b21 * v1 + b22 * v2 + b23 * v3 + b24 * v4) * det_1;
      ky3 = (b21 + b22 + b23 + b24) * det_1;
      ky4 = (b31 * v1 + b32 * v2 + b33 * v3 + b34 * v4) * det_1;
      ky5 = (b31 + b32 + b33 + b34) * det_1;
      ky6 = (b41 * v1 + b42 * v2 + b43 * v3 + b44 * v4) * det_1;
      ky7 = (b41 + b42 + b43 + b44) * det_1;
    }
    det_1 = kx5 * (-ky7) - (-ky5) * kx7;
    if (det_1 == 0) {
      det_1=0.0001;
      //System.out.println("Could not get inverse matrix(3).");
      //return false;
    }
    det_1 = 1 / det_1;
    var C, F;
    o_param[2] = C = (-ky7 * det_1) * (kx4 - ky4) + (ky5 * det_1) * (kx6 - ky6); // C
    o_param[5] = F = (-kx7 * det_1) * (kx4 - ky4) + (kx5 * det_1) * (kx6 - ky6); // F
    o_param[6] = kx4 - C * kx5;
    o_param[7] = kx6 - C * kx7;
    o_param[0] = kx0 - C * kx1;
    o_param[1] = kx2 - C * kx3;
    o_param[3] = ky0 - F * ky1;
    o_param[4] = ky2 - F * ky3;
    return true;
  }
})
