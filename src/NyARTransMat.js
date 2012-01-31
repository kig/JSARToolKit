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


/**
 * This class calculates ARMatrix from square information. -- 変換行列を計算するクラス。
 *
 */
INyARTransMat = Klass( {
  transMat : function(i_square,i_offset, o_result ){},
  transMatContinue : function(i_square,i_offset ,io_result_conv){}
})

/**
 * 矩形の頂点情報を格納します。
 */
NyARRectOffset = ASKlass('NyARRectOffset', {

  vertex : NyARDoublePoint3d.createArray(4),
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARRectOffset();
    }
    return ret;
  },

  /**
  * 中心位置と辺長から、オフセット情報を作成して設定する。
  * @param i_width
  */
  setSquare : function(i_width)
  {
    var w_2 = i_width / 2.0;
    var vertex3d_ptr;
    vertex3d_ptr= this.vertex[0];
    vertex3d_ptr.x = -w_2;
    vertex3d_ptr.y =  w_2;
    vertex3d_ptr.z = 0.0;
    vertex3d_ptr= this.vertex[1];
    vertex3d_ptr.x = w_2;
    vertex3d_ptr.y = w_2;
    vertex3d_ptr.z = 0.0;
    vertex3d_ptr= this.vertex[2];
    vertex3d_ptr.x =  w_2;
    vertex3d_ptr.y = -w_2;
    vertex3d_ptr.z = 0.0;
    vertex3d_ptr= this.vertex[3];
    vertex3d_ptr.x = -w_2;
    vertex3d_ptr.y = -w_2;
    vertex3d_ptr.z = 0.0;
    return;
  }
})







/**
 * This class calculates ARMatrix from square information and holds it. --
 * 変換行列を計算して、結果を保持するクラス。
 *
 */
NyARTransMat = ASKlass('NyARTransMat',INyARTransMat,
{
  _projection_mat_ref : null,
  _rotmatrix : null,
  _transsolver : null,
  _mat_optimize : null,
  _ref_dist_factor : null,
  NyARTransMat : function(i_param)
  {
    var dist=i_param.getDistortionFactor();
    var pmat=i_param.getPerspectiveProjectionMatrix();
    this._transsolver=new NyARTransportVectorSolver(pmat,4);
    //互換性が重要な時は、NyARRotMatrix_ARToolKitを使うこと。
    //理屈はNyARRotMatrix_NyARToolKitもNyARRotMatrix_ARToolKitも同じだけど、少しだけ値がずれる。
    this._rotmatrix = new NyARRotMatrix(pmat);
    this._mat_optimize=new NyARPartialDifferentiationOptimize(pmat);
    this._ref_dist_factor=dist;
    this._projection_mat_ref=pmat;
    this.__transMat_vertex_2d = NyARDoublePoint2d.createArray(4);
    this.__transMat_vertex_3d = NyARDoublePoint3d.createArray(4);
    this.__transMat_trans = new NyARDoublePoint3d();
    this.__rot=new NyARDoubleMatrix33();
  },
  /**
   * 頂点情報を元に、エラー閾値を計算します。
   * @param i_vertex
   */
  makeErrThreshold : function(i_vertex)
  {
    var a,b,l1,l2;
    a=i_vertex[0].x-i_vertex[2].x;
    b=i_vertex[0].y-i_vertex[2].y;
    l1=a*a+b*b;
    a=i_vertex[1].x-i_vertex[3].x;
    b=i_vertex[1].y-i_vertex[3].y;
    l2=a*a+b*b;
    return (Math.sqrt(l1>l2?l1:l2))/200;
  },
  /**
   * double arGetTransMat( ARMarkerInfo *marker_info,double center[2], double width, double conv[3][4] )
   *
   * @param i_square
   * 計算対象のNyARSquareオブジェクト
   * @param i_direction
   * @param i_width
   * @return
   * @throws NyARException
   */
  transMat : function(i_square,i_offset,o_result_conv)
  {
    var trans=this.__transMat_trans;
    var err_threshold=this.makeErrThreshold(i_square.sqvertex);
    //平行移動量計算機に、2D座標系をセット
    var vertex_2d=this.__transMat_vertex_2d;
    var vertex_3d=this.__transMat_vertex_3d;
    this._ref_dist_factor.ideal2ObservBatch(i_square.sqvertex, vertex_2d,4);
    this._transsolver.set2dVertex(vertex_2d,4);
    //回転行列を計算
    this._rotmatrix.initRotBySquare(i_square.line,i_square.sqvertex);
    //回転後の3D座標系から、平行移動量を計算
    this._rotmatrix.getPoint3dBatch(i_offset.vertex,vertex_3d,4);
    this._transsolver.solveTransportVector(vertex_3d,trans);
    //計算結果の最適化(平行移動量と回転行列の最適化)
    o_result_conv.error=this.optimize(this._rotmatrix, trans, this._transsolver,i_offset.vertex, vertex_2d,err_threshold);
    // マトリクスの保存
    this.updateMatrixValue(this._rotmatrix, trans,o_result_conv);
    return;
  },
  /*
   * (non-Javadoc)
   * @see jp.nyatla.nyartoolkit.core.transmat.INyARTransMat#transMatContinue(jp.nyatla.nyartoolkit.core.NyARSquare, int, double, jp.nyatla.nyartoolkit.core.transmat.NyARTransMatResult)
   */
  transMatContinue : function(i_square,i_offset,o_result_conv)
  {
    var trans=this.__transMat_trans;
    // io_result_convが初期値なら、transMatで計算する。
    if (!o_result_conv.has_value) {
      this.transMat(i_square,i_offset, o_result_conv);
      return;
    }
    //最適化計算の閾値を決定
    var err_threshold=this.makeErrThreshold(i_square.sqvertex);
    //平行移動量計算機に、2D座標系をセット
    var vertex_2d=this.__transMat_vertex_2d;
    var vertex_3d=this.__transMat_vertex_3d;
    this._ref_dist_factor.ideal2ObservBatch(i_square.sqvertex, vertex_2d,4);
    this._transsolver.set2dVertex(vertex_2d,4);
    //回転行列を計算
    this._rotmatrix.initRotByPrevResult(o_result_conv);
    //回転後の3D座標系から、平行移動量を計算
    this._rotmatrix.getPoint3dBatch(i_offset.vertex,vertex_3d,4);
    this._transsolver.solveTransportVector(vertex_3d,trans);
    //現在のエラーレートを計算しておく
    var min_err=this.errRate(this._rotmatrix,trans,i_offset.vertex, vertex_2d,4,vertex_3d);
    var rot=this.__rot;
    //エラーレートが前回のエラー値より閾値分大きかったらアゲイン
    if(min_err<o_result_conv.error+err_threshold){
      rot.setValue_NyARDoubleMatrix33(this._rotmatrix);
      //最適化してみる。
      for (var i = 0;i<5; i++) {
        //変換行列の最適化
        this._mat_optimize.modifyMatrix(rot, trans, i_offset.vertex, vertex_2d, 4);
        var err=this.errRate(rot,trans,i_offset.vertex, vertex_2d,4,vertex_3d);
        //System.out.println("E:"+err);
        if(min_err-err<err_threshold/2){
          //System.out.println("BREAK");
          break;
        }
        this._transsolver.solveTransportVector(vertex_3d, trans);
        this._rotmatrix.setValue_NyARDoubleMatrix33(rot);
        min_err=err;
      }
      this.updateMatrixValue(this._rotmatrix,  trans,o_result_conv);
    }else{
      //回転行列を計算
      this._rotmatrix.initRotBySquare(i_square.line,i_square.sqvertex);
      //回転後の3D座標系から、平行移動量を計算
      this._rotmatrix.getPoint3dBatch(i_offset.vertex,vertex_3d,4);
      this._transsolver.solveTransportVector(vertex_3d,trans);
      //計算結果の最適化(平行移動量と回転行列の最適化)
      min_err=this.optimize(this._rotmatrix, trans, this._transsolver,i_offset.vertex, vertex_2d,err_threshold);
      this.updateMatrixValue(this._rotmatrix, trans,o_result_conv);
    }
    o_result_conv.error=min_err;
    return;
  },

  optimize : function(io_rotmat,io_transvec,i_solver,i_offset_3d,i_2d_vertex,i_err_threshold)
  {
    //System.out.println("START");
    var vertex_3d=this.__transMat_vertex_3d;
    //初期のエラー値を計算
    var min_err=this.errRate(io_rotmat, io_transvec, i_offset_3d, i_2d_vertex,4,vertex_3d);
    var rot=this.__rot;
    rot.setValue_NyARDoubleMatrix33(io_rotmat);
    for (var i = 0;i<5; i++) {
      //変換行列の最適化
      this._mat_optimize.modifyMatrix(rot, io_transvec, i_offset_3d, i_2d_vertex, 4);
      var err=this.errRate(rot,io_transvec, i_offset_3d, i_2d_vertex,4,vertex_3d);
      //System.out.println("E:"+err);
      if(min_err-err<i_err_threshold){
        //System.out.println("BREAK");
        break;
      }
      i_solver.solveTransportVector(vertex_3d, io_transvec);
      io_rotmat.setValue_NyARDoubleMatrix33(rot);
      min_err=err;
    }
    //System.out.println("END");
    return min_err;
  },
  //エラーレート計算機
  errRate : function(io_rot,i_trans,i_vertex3d,i_vertex2d,i_number_of_vertex,o_rot_vertex)
  {
    var cp = this._projection_mat_ref;
    var cp00=cp.m00;
    var cp01=cp.m01;
    var cp02=cp.m02;
    var cp11=cp.m11;
    var cp12=cp.m12;
    var err=0;
    for(var i=0;i<i_number_of_vertex;i++){
      var x3d,y3d,z3d;
      o_rot_vertex[i].x=x3d=io_rot.m00*i_vertex3d[i].x+io_rot.m01*i_vertex3d[i].y+io_rot.m02*i_vertex3d[i].z;
      o_rot_vertex[i].y=y3d=io_rot.m10*i_vertex3d[i].x+io_rot.m11*i_vertex3d[i].y+io_rot.m12*i_vertex3d[i].z;
      o_rot_vertex[i].z=z3d=io_rot.m20*i_vertex3d[i].x+io_rot.m21*i_vertex3d[i].y+io_rot.m22*i_vertex3d[i].z;
      x3d+=i_trans.x;
      y3d+=i_trans.y;
      z3d+=i_trans.z;
      //射影変換
      var x2d=x3d*cp00+y3d*cp01+z3d*cp02;
      var y2d=y3d*cp11+z3d*cp12;
      var h2d=z3d;
      //エラーレート計算
      var t1=i_vertex2d[i].x-x2d/h2d;
      var t2=i_vertex2d[i].y-y2d/h2d;
      err+=t1*t1+t2*t2;
    }
    return err/i_number_of_vertex;
  },
  /**
   * パラメータで変換行列を更新します。
   *
   * @param i_rot
   * @param i_off
   * @param i_trans
   */
  updateMatrixValue : function(i_rot,i_trans,o_result)
  {
    o_result.m00=i_rot.m00;
    o_result.m01=i_rot.m01;
    o_result.m02=i_rot.m02;
    o_result.m03=i_trans.x;
    o_result.m10 =i_rot.m10;
    o_result.m11 =i_rot.m11;
    o_result.m12 =i_rot.m12;
    o_result.m13 =i_trans.y;
    o_result.m20 = i_rot.m20;
    o_result.m21 = i_rot.m21;
    o_result.m22 = i_rot.m22;
    o_result.m23 = i_trans.z;
    o_result.has_value = true;
    return;
  }
})


NyARTransMatResult = ASKlass('NyARTransMatResult', NyARDoubleMatrix34,
{
  /**
   * エラーレート。この値はINyARTransMatの派生クラスが使います。
   */
  error : 0,
  has_value : false,
  /**
   * この関数は、0-PIの間で値を返します。
   * @param o_out
   */
  getZXYAngle : function(o_out)
  {
    var sina = this.m21;
    if (sina >= 1.0) {
      o_out.x = Math.PI / 2;
      o_out.y = 0;
      o_out.z = Math.atan2(-this.m10, this.m00);
    } else if (sina <= -1.0) {
      o_out.x = -Math.PI / 2;
      o_out.y = 0;
      o_out.z = Math.atan2(-this.m10, this.m00);
    } else {
      o_out.x = Math.asin(sina);
      o_out.z = Math.atan2(-this.m01, this.m11);
      o_out.y = Math.atan2(-this.m20, this.m22);
    }
  },
  transformVertex_Number : function(i_x,i_y,i_z,o_out)
  {
    o_out.x=this.m00*i_x+this.m01*i_y+this.m02*i_z+this.m03;
    o_out.y=this.m10*i_x+this.m11*i_y+this.m12*i_z+this.m13;
    o_out.z=this.m20*i_x+this.m21*i_y+this.m22*i_z+this.m23;
    return;
  },
  transformVertex_NyARDoublePoint3d : function(i_in,o_out)
  {
    this.transformVertex_Number(i_in.x,i_in.y,i_in.z,o_out);
  }
})





/**
 * 基本姿勢と実画像を一致するように、角度を微調整→平行移動量を再計算 を繰り返して、変換行列を最適化する。
 *
 */
NyARPartialDifferentiationOptimize = ASKlass('NyARPartialDifferentiationOptimize',
{
  _projection_mat_ref : null,
  NyARPartialDifferentiationOptimize : function(i_projection_mat_ref)
  {
    this._projection_mat_ref = i_projection_mat_ref;
    this.__angles_in=TSinCosValue.createArray(3);
    this.__ang=new NyARDoublePoint3d();
    this.__sin_table = new FloatVector(4);
    return;
  },
  sincos2Rotation_ZXY : function(i_sincos,i_rot_matrix)
  {
    var sina = i_sincos[0].sin_val;
    var cosa = i_sincos[0].cos_val;
    var sinb = i_sincos[1].sin_val;
    var cosb = i_sincos[1].cos_val;
    var sinc = i_sincos[2].sin_val;
    var cosc = i_sincos[2].cos_val;
    i_rot_matrix.m00 = cosc * cosb - sinc * sina * sinb;
    i_rot_matrix.m01 = -sinc * cosa;
    i_rot_matrix.m02 = cosc * sinb + sinc * sina * cosb;
    i_rot_matrix.m10 = sinc * cosb + cosc * sina * sinb;
    i_rot_matrix.m11 = cosc * cosa;
    i_rot_matrix.m12 = sinc * sinb - cosc * sina * cosb;
    i_rot_matrix.m20 = -cosa * sinb;
    i_rot_matrix.m21 = sina;
    i_rot_matrix.m22 = cosb * cosa;
  },
  rotation2Sincos_ZXY : function(i_rot_matrix,o_out,o_ang)
  {
    var x, y, z;
    var sina = i_rot_matrix.m21;
    if (sina >= 1.0) {
      x = Math.PI / 2;
      y = 0;
      z = Math.atan2(-i_rot_matrix.m10, i_rot_matrix.m00);
    } else if (sina <= -1.0) {
      x = -Math.PI / 2;
      y = 0;
      z = Math.atan2(-i_rot_matrix.m10, i_rot_matrix.m00);
    } else {
      x = Math.asin(sina);
      y = Math.atan2(-i_rot_matrix.m20, i_rot_matrix.m22);
      z = Math.atan2(-i_rot_matrix.m01, i_rot_matrix.m11);
    }
    o_ang.x=x;
    o_ang.y=y;
    o_ang.z=z;
    o_out[0].sin_val = Math.sin(x);
    o_out[0].cos_val = Math.cos(x);
    o_out[1].sin_val = Math.sin(y);
    o_out[1].cos_val = Math.cos(y);
    o_out[2].sin_val = Math.sin(z);
    o_out[2].cos_val = Math.cos(z);
    return;
  },
  /*
   * 射影変換式 基本式 ox=(cosc * cosb - sinc * sina * sinb)*ix+(-sinc * cosa)*iy+(cosc * sinb + sinc * sina * cosb)*iz+i_trans.x; oy=(sinc * cosb + cosc * sina *
   * sinb)*ix+(cosc * cosa)*iy+(sinc * sinb - cosc * sina * cosb)*iz+i_trans.y; oz=(-cosa * sinb)*ix+(sina)*iy+(cosb * cosa)*iz+i_trans.z;
   *
   * double ox=(cosc * cosb)*ix+(-sinc * sina * sinb)*ix+(-sinc * cosa)*iy+(cosc * sinb)*iz + (sinc * sina * cosb)*iz+i_trans.x; double oy=(sinc * cosb)*ix
   * +(cosc * sina * sinb)*ix+(cosc * cosa)*iy+(sinc * sinb)*iz+(- cosc * sina * cosb)*iz+i_trans.y; double oz=(-cosa * sinb)*ix+(sina)*iy+(cosb *
   * cosa)*iz+i_trans.z;
   *
   * sina,cosaについて解く cx=(cp00*(-sinc*sinb*ix+sinc*cosb*iz)+cp01*(cosc*sinb*ix-cosc*cosb*iz)+cp02*(iy))*sina
   * +(cp00*(-sinc*iy)+cp01*((cosc*iy))+cp02*(-sinb*ix+cosb*iz))*cosa
   * +(cp00*(i_trans.x+cosc*cosb*ix+cosc*sinb*iz)+cp01*((i_trans.y+sinc*cosb*ix+sinc*sinb*iz))+cp02*(i_trans.z));
   * cy=(cp11*(cosc*sinb*ix-cosc*cosb*iz)+cp12*(iy))*sina +(cp11*((cosc*iy))+cp12*(-sinb*ix+cosb*iz))*cosa
   * +(cp11*((i_trans.y+sinc*cosb*ix+sinc*sinb*iz))+cp12*(i_trans.z)); ch=(iy)*sina +(-sinb*ix+cosb*iz)*cosa +i_trans.z; sinb,cosb hx=(cp00*(-sinc *
   * sina*ix+cosc*iz)+cp01*(cosc * sina*ix+sinc*iz)+cp02*(-cosa*ix))*sinb +(cp01*(sinc*ix-cosc * sina*iz)+cp00*(cosc*ix+sinc * sina*iz)+cp02*(cosa*iz))*cosb
   * +(cp00*(i_trans.x+(-sinc*cosa)*iy)+cp01*(i_trans.y+(cosc * cosa)*iy)+cp02*(i_trans.z+(sina)*iy)); double hy=(cp11*(cosc *
   * sina*ix+sinc*iz)+cp12*(-cosa*ix))*sinb +(cp11*(sinc*ix-cosc * sina*iz)+cp12*(cosa*iz))*cosb +(cp11*(i_trans.y+(cosc *
   * cosa)*iy)+cp12*(i_trans.z+(sina)*iy)); double h =((-cosa*ix)*sinb +(cosa*iz)*cosb +i_trans.z+(sina)*iy); パラメータ返還式 L=2*Σ(d[n]*e[n]+a[n]*b[n])
   * J=2*Σ(d[n]*f[n]+a[n]*c[n])/L K=2*Σ(-e[n]*f[n]+b[n]*c[n])/L M=Σ(-e[n]^2+d[n]^2-b[n]^2+a[n]^2)/L 偏微分式 +J*cos(x) +K*sin(x) -sin(x)^2 +cos(x)^2
   * +2*M*cos(x)*sin(x)
   */
  optimizeParamX : function(i_angle_y,i_angle_z,i_trans,i_vertex3d, i_vertex2d,i_number_of_vertex,i_hint_angle)
  {
    var cp = this._projection_mat_ref;
    var sinb = i_angle_y.sin_val;
    var cosb = i_angle_y.cos_val;
    var sinc = i_angle_z.sin_val;
    var cosc = i_angle_z.cos_val;
    var L, J, K, M, N, O;
    L = J = K = M = N = O = 0;
    for (var i = 0; i < i_number_of_vertex; i++) {
      var ix, iy, iz;
      ix = i_vertex3d[i].x;
      iy = i_vertex3d[i].y;
      iz = i_vertex3d[i].z;
      var cp00 = cp.m00;
      var cp01 = cp.m01;
      var cp02 = cp.m02;
      var cp11 = cp.m11;
      var cp12 = cp.m12;
      var X0 = (cp00 * (-sinc * sinb * ix + sinc * cosb * iz) + cp01 * (cosc * sinb * ix - cosc * cosb * iz) + cp02 * (iy));
      var X1 = (cp00 * (-sinc * iy) + cp01 * ((cosc * iy)) + cp02 * (-sinb * ix + cosb * iz));
      var X2 = (cp00 * (i_trans.x + cosc * cosb * ix + cosc * sinb * iz) + cp01 * ((i_trans.y + sinc * cosb * ix + sinc * sinb * iz)) + cp02 * (i_trans.z));
      var Y0 = (cp11 * (cosc * sinb * ix - cosc * cosb * iz) + cp12 * (iy));
      var Y1 = (cp11 * ((cosc * iy)) + cp12 * (-sinb * ix + cosb * iz));
      var Y2 = (cp11 * ((i_trans.y + sinc * cosb * ix + sinc * sinb * iz)) + cp12 * (i_trans.z));
      var H0 = (iy);
      var H1 = (-sinb * ix + cosb * iz);
      var H2 = i_trans.z;
      var VX = i_vertex2d[i].x;
      var VY = i_vertex2d[i].y;
      var a, b, c, d, e, f;
      a = (VX * H0 - X0);
      b = (VX * H1 - X1);
      c = (VX * H2 - X2);
      d = (VY * H0 - Y0);
      e = (VY * H1 - Y1);
      f = (VY * H2 - Y2);
      L += d * e + a * b;
      N += d * d + a * a;
      J += d * f + a * c;
      M += e * e + b * b;
      K += e * f + b * c;
      O += f * f + c * c;
    }
    L *=2;
    J *=2;
    K *=2;
    return this.getMinimumErrorAngleFromParam(L,J, K, M, N, O, i_hint_angle);
  },
  optimizeParamY : function(i_angle_x,i_angle_z,i_trans,i_vertex3d,i_vertex2d,i_number_of_vertex,i_hint_angle)
  {
    var cp = this._projection_mat_ref;
    var sina = i_angle_x.sin_val;
    var cosa = i_angle_x.cos_val;
    var sinc = i_angle_z.sin_val;
    var cosc = i_angle_z.cos_val;
    var L, J, K, M, N, O;
    L = J = K = M = N = O = 0;
    for (var i = 0; i < i_number_of_vertex; i++) {
      var ix, iy, iz;
      ix = i_vertex3d[i].x;
      iy = i_vertex3d[i].y;
      iz = i_vertex3d[i].z;
      var cp00 = cp.m00;
      var cp01 = cp.m01;
      var cp02 = cp.m02;
      var cp11 = cp.m11;
      var cp12 = cp.m12;
      var X0 = (cp00 * (-sinc * sina * ix + cosc * iz) + cp01 * (cosc * sina * ix + sinc * iz) + cp02 * (-cosa * ix));
      var X1 = (cp01 * (sinc * ix - cosc * sina * iz) + cp00 * (cosc * ix + sinc * sina * iz) + cp02 * (cosa * iz));
      var X2 = (cp00 * (i_trans.x + (-sinc * cosa) * iy) + cp01 * (i_trans.y + (cosc * cosa) * iy) + cp02 * (i_trans.z + (sina) * iy));
      var Y0 = (cp11 * (cosc * sina * ix + sinc * iz) + cp12 * (-cosa * ix));
      var Y1 = (cp11 * (sinc * ix - cosc * sina * iz) + cp12 * (cosa * iz));
      var Y2 = (cp11 * (i_trans.y + (cosc * cosa) * iy) + cp12 * (i_trans.z + (sina) * iy));
      var H0 = (-cosa * ix);
      var H1 = (cosa * iz);
      var H2 = i_trans.z + (sina) * iy;
      var VX = i_vertex2d[i].x;
      var VY = i_vertex2d[i].y;
      var a, b, c, d, e, f;
      a = (VX * H0 - X0);
      b = (VX * H1 - X1);
      c = (VX * H2 - X2);
      d = (VY * H0 - Y0);
      e = (VY * H1 - Y1);
      f = (VY * H2 - Y2);
      L += d * e + a * b;
      N += d * d + a * a;
      J += d * f + a * c;
      M += e * e + b * b;
      K += e * f + b * c;
      O += f * f + c * c;
    }
    L *= 2;
    J *= 2;
    K *= 2;
    return this.getMinimumErrorAngleFromParam(L,J, K, M, N, O, i_hint_angle);
  },
  optimizeParamZ : function(i_angle_x,i_angle_y,i_trans,i_vertex3d,i_vertex2d,i_number_of_vertex,i_hint_angle)
  {
    var cp = this._projection_mat_ref;
    var sina = i_angle_x.sin_val;
    var cosa = i_angle_x.cos_val;
    var sinb = i_angle_y.sin_val;
    var cosb = i_angle_y.cos_val;
    var L, J, K, M, N, O;
    L = J = K = M = N = O = 0;
    for (var i = 0; i < i_number_of_vertex; i++) {
      var ix, iy, iz;
      ix = i_vertex3d[i].x;
      iy = i_vertex3d[i].y;
      iz = i_vertex3d[i].z;
      var cp00 = cp.m00;
      var cp01 = cp.m01;
      var cp02 = cp.m02;
      var cp11 = cp.m11;
      var cp12 = cp.m12;
      var X0 = (cp00 * (-sina * sinb * ix - cosa * iy + sina * cosb * iz) + cp01 * (ix * cosb + sinb * iz));
      var X1 = (cp01 * (sina * ix * sinb + cosa * iy - sina * iz * cosb) + cp00 * (cosb * ix + sinb * iz));
      var X2 = cp00 * i_trans.x + cp01 * (i_trans.y) + cp02 * (-cosa * sinb) * ix + cp02 * (sina) * iy + cp02 * ((cosb * cosa) * iz + i_trans.z);
      var Y0 = cp11 * (ix * cosb + sinb * iz);
      var Y1 = cp11 * (sina * ix * sinb + cosa * iy - sina * iz * cosb);
      var Y2 = (cp11 * i_trans.y + cp12 * (-cosa * sinb) * ix + cp12 * ((sina) * iy + (cosb * cosa) * iz + i_trans.z));
      var H0 = 0;
      var H1 = 0;
      var H2 = ((-cosa * sinb) * ix + (sina) * iy + (cosb * cosa) * iz + i_trans.z);
      var VX = i_vertex2d[i].x;
      var VY = i_vertex2d[i].y;
      var a, b, c, d, e, f;
      a = (VX * H0 - X0);
      b = (VX * H1 - X1);
      c = (VX * H2 - X2);
      d = (VY * H0 - Y0);
      e = (VY * H1 - Y1);
      f = (VY * H2 - Y2);
      L += d * e + a * b;
      N += d * d + a * a;
      J += d * f + a * c;
      M += e * e + b * b;
      K += e * f + b * c;
      O += f * f + c * c;
    }
    L *=2;
    J *=2;
    K *=2;
    return this.getMinimumErrorAngleFromParam(L,J, K, M, N, O, i_hint_angle);
  },
  modifyMatrix : function(io_rot,i_trans,i_vertex3d,i_vertex2d,i_number_of_vertex)
  {
    var angles_in = this.__angles_in;// x,y,z
    var ang = this.__ang;
    // ZXY系のsin/cos値を抽出
    this.rotation2Sincos_ZXY(io_rot, angles_in,ang);
    ang.x += this.optimizeParamX(angles_in[1], angles_in[2], i_trans, i_vertex3d, i_vertex2d, i_number_of_vertex, ang.x);
    ang.y += this.optimizeParamY(angles_in[0], angles_in[2], i_trans, i_vertex3d, i_vertex2d, i_number_of_vertex, ang.y);
    ang.z += this.optimizeParamZ(angles_in[0], angles_in[1], i_trans, i_vertex3d, i_vertex2d, i_number_of_vertex, ang.z);
    io_rot.setZXYAngle_Number(ang.x, ang.y, ang.z);
    return;
  },
  /**
   * エラーレートが最小になる点を得る。
   */
  getMinimumErrorAngleFromParam : function(iL,iJ,iK,iM,iN,iO,i_hint_angle)
  {
    var sin_table = this.__sin_table;
    var M = (iN - iM)/iL;
    var J = iJ/iL;
    var K = -iK/iL;
    // パラメータからsinテーブルを作成
    // (- 4*M^2-4)*x^4 + (4*K- 4*J*M)*x^3 + (4*M^2 -(K^2- 4)- J^2)*x^2 +(4*J*M- 2*K)*x + J^2-1 = 0
    var number_of_sin = NyAREquationSolver.solve4Equation(-4 * M * M - 4, 4 * K - 4 * J * M, 4 * M * M - (K * K - 4) - J * J, 4 * J * M - 2 * K, J * J - 1, sin_table);
    // 最小値２個を得ておく。
    var min_ang_0 = Number.MAX_VALUE;
    var min_ang_1 = Number.MAX_VALUE;
    var min_err_0 = Number.MAX_VALUE;
    var min_err_1 = Number.MAX_VALUE;
    for (var i = 0; i < number_of_sin; i++) {
      // +-cos_v[i]が頂点候補
      var sin_rt = sin_table[i];
      var cos_rt = Math.sqrt(1 - (sin_rt * sin_rt));
      // cosを修復。微分式で0に近い方が正解
      // 0 = 2*cos(x)*sin(x)*M - sin(x)^2 + cos(x)^2 + sin(x)*K + cos(x)*J
      var a1 = 2 * cos_rt * sin_rt * M + sin_rt * (K - sin_rt) + cos_rt * (cos_rt + J);
      var a2 = 2 * (-cos_rt) * sin_rt * M + sin_rt * (K - sin_rt) + (-cos_rt) * ((-cos_rt) + J);
      // 絶対値になおして、真のcos値を得ておく。
      a1 = a1 < 0 ? -a1 : a1;
      a2 = a2 < 0 ? -a2 : a2;
      cos_rt = (a1 < a2) ? cos_rt : -cos_rt;
      var ang = Math.atan2(sin_rt, cos_rt);
      // エラー値を計算
      var err = iN * sin_rt * sin_rt + (iL*cos_rt + iJ) * sin_rt + iM * cos_rt * cos_rt + iK * cos_rt + iO;
      // 最小の２個を獲得する。
      if (min_err_0 > err) {
        min_err_1 = min_err_0;
        min_ang_1 = min_ang_0;
        min_err_0 = err;
        min_ang_0 = ang;
      } else if (min_err_1 > err) {
        min_err_1 = err;
        min_ang_1 = ang;
      }
    }
    // [0]をテスト
    var gap_0;
    gap_0 = min_ang_0 - i_hint_angle;
    if (gap_0 > Math.PI) {
      gap_0 = (min_ang_0 - Math.PI * 2) - i_hint_angle;
    } else if (gap_0 < -Math.PI) {
      gap_0 = (min_ang_0 + Math.PI * 2) - i_hint_angle;
    }
    // [1]をテスト
    var gap_1;
    gap_1 = min_ang_1 - i_hint_angle;
    if (gap_1 > Math.PI) {
      gap_1 = (min_ang_1 - Math.PI * 2) - i_hint_angle;
    } else if (gap_1 < -Math.PI) {
      gap_1 = (min_ang_1 + Math.PI * 2) - i_hint_angle;
    }
    return Math.abs(gap_1) < Math.abs(gap_0) ? gap_1 : gap_0;
  }
})

TSinCosValue = ASKlass('TSinCosValue',{
  cos_val : 0,
  sin_val : 0,
  createArray : function(i_size)
  {
    var result=new Array(i_size);
    for(var i=0;i<i_size;i++){
      result[i]=new TSinCosValue();
    }
    return result;
  }
})




/**
 * 回転行列計算用の、3x3行列
 *
 */
NyARRotMatrix = ASKlass('NyARRotMatrix',NyARDoubleMatrix33,
{
  /**
   * インスタンスを準備します。
   *
   * @param i_param
   */
  NyARRotMatrix : function(i_matrix)
  {
    this.__initRot_vec1=new NyARRotVector(i_matrix);
    this.__initRot_vec2=new NyARRotVector(i_matrix);
    return;
  },
  __initRot_vec1 : null,
  __initRot_vec2 : null,
  /**
   * NyARTransMatResultの内容からNyARRotMatrixを復元します。
   * @param i_prev_result
   */
  initRotByPrevResult : function(i_prev_result)
  {
    this.m00=i_prev_result.m00;
    this.m01=i_prev_result.m01;
    this.m02=i_prev_result.m02;
    this.m10=i_prev_result.m10;
    this.m11=i_prev_result.m11;
    this.m12=i_prev_result.m12;
    this.m20=i_prev_result.m20;
    this.m21=i_prev_result.m21;
    this.m22=i_prev_result.m22;
    return;
  },
  /**
   *
   * @param i_linear
   * @param i_sqvertex
   * @throws NyARException
   */
  initRotBySquare : function(i_linear, i_sqvertex)
  {
    var vec1=this.__initRot_vec1;
    var vec2=this.__initRot_vec2;
    //向かい合った辺から、２本のベクトルを計算
    //軸１
    vec1.exteriorProductFromLinear(i_linear[0], i_linear[2]);
    vec1.checkVectorByVertex(i_sqvertex[0], i_sqvertex[1]);
    //軸２
    vec2.exteriorProductFromLinear(i_linear[1], i_linear[3]);
    vec2.checkVectorByVertex(i_sqvertex[3], i_sqvertex[0]);
    //回転の最適化？
    NyARRotVector.checkRotation(vec1,vec2);
    this.m00 =vec1.v1;
    this.m10 =vec1.v2;
    this.m20 =vec1.v3;
    this.m01 =vec2.v1;
    this.m11 =vec2.v2;
    this.m21 =vec2.v3;
    //最後の軸を計算
    var w02 = vec1.v2 * vec2.v3 - vec1.v3 * vec2.v2;
    var w12 = vec1.v3 * vec2.v1 - vec1.v1 * vec2.v3;
    var w22 = vec1.v1 * vec2.v2 - vec1.v2 * vec2.v1;
    var w = Math.sqrt(w02 * w02 + w12 * w12 + w22 * w22);
    this.m02 = w02/w;
    this.m12 = w12/w;
    this.m22 = w22/w;
    return;
  },
  /**
   * i_in_pointを変換行列で座標変換する。
   * @param i_in_point
   * @param i_out_point
   */
  getPoint3d : function(i_in_point,i_out_point)
  {
    var x=i_in_point.x;
    var y=i_in_point.y;
    var z=i_in_point.z;
    i_out_point.x=this.m00 * x + this.m01 * y + this.m02 * z;
    i_out_point.y=this.m10 * x + this.m11 * y + this.m12 * z;
    i_out_point.z=this.m20 * x + this.m21 * y + this.m22 * z;
    return;
  },
  /**
   * 複数の頂点を一括して変換する
   * @param i_in_point
   * @param i_out_point
   * @param i_number_of_vertex
   */
  getPoint3dBatch : function(i_in_point,i_out_point,i_number_of_vertex)
  {
    for(var i=i_number_of_vertex-1;i>=0;i--){
      var out_ptr =i_out_point[i];
      var in_ptr=i_in_point[i];
      var x=in_ptr.x;
      var y=in_ptr.y;
      var z=in_ptr.z;
      out_ptr.x=this.m00 * x + this.m01 * y + this.m02 * z;
      out_ptr.y=this.m10 * x + this.m11 * y + this.m12 * z;
      out_ptr.z=this.m20 * x + this.m21 * y + this.m22 * z;
    }
    return;
  }
})




NyARRotVector = ASKlass('NyARRotVector',
{
  //publicメンバ達
  v1 : 0,
  v2 : 0,
  v3 : 0,
  //privateメンバ達
  _projection_mat_ref : null,
  _inv_cpara_array_ref : null,
  NyARRotVector : function(i_cmat)
  {
    var mat_a = new NyARMat(3, 3);
    var a_array = mat_a.getArray();
    a_array[0][0] =i_cmat.m00;
    a_array[0][1] =i_cmat.m01;
    a_array[0][2] =i_cmat.m02;
    a_array[1][0] =i_cmat.m10;
    a_array[1][1] =i_cmat.m11;
    a_array[1][2] =i_cmat.m12;
    a_array[2][0] =i_cmat.m20;
    a_array[2][1] =i_cmat.m21;
    a_array[2][2] =i_cmat.m22;
    mat_a.matrixSelfInv();
    this._projection_mat_ref = i_cmat;
    this._inv_cpara_array_ref = mat_a.getArray();
    //GCない言語のときは、ここで配列の所有権委譲してね！
  },
  /**
   * ２直線に直交するベクトルを計算する・・・だと思う。
   * @param i_linear1
   * @param i_linear2
   */
  exteriorProductFromLinear : function(i_linear1,i_linear2)
  {
    //1行目
    var cmat= this._projection_mat_ref;
    var w1 = i_linear1.dy * i_linear2.dx - i_linear2.dy * i_linear1.dx;
    var w2 = i_linear1.dx * i_linear2.c - i_linear2.dx * i_linear1.c;
    var w3 = i_linear1.c * i_linear2.dy - i_linear2.c * i_linear1.dy;
    var m0 = w1 * (cmat.m01 * cmat.m12 - cmat.m02 * cmat.m11) + w2 * cmat.m11 - w3 * cmat.m01;//w1 * (cpara[0 * 4 + 1] * cpara[1 * 4 + 2] - cpara[0 * 4 + 2] * cpara[1 * 4 + 1]) + w2 * cpara[1 * 4 + 1] - w3 * cpara[0 * 4 + 1];
    var m1 = -w1 * cmat.m00 * cmat.m12 + w3 * cmat.m00;//-w1 * cpara[0 * 4 + 0] * cpara[1 * 4 + 2] + w3 * cpara[0 * 4 + 0];
    var m2 = w1 * cmat.m00 * cmat.m11;//w1 * cpara[0 * 4 + 0] * cpara[1 * 4 + 1];
    var w = Math.sqrt(m0 * m0 + m1 * m1 + m2 * m2);
    this.v1 = m0 / w;
    this.v2 = m1 / w;
    this.v3 = m2 / w;
    return;
  },
  /**
   * static int check_dir( double dir[3], double st[2], double ed[2],double cpara[3][4] ) Optimize[526->468]
   * ベクトルの開始/終了座標を指定して、ベクトルの方向を調整する。
   * @param i_start_vertex
   * @param i_end_vertex
   * @param cpara
   */
  checkVectorByVertex : function(i_start_vertex, i_end_vertex)
  {
    var h;
    var inv_cpara = this._inv_cpara_array_ref;
    //final double[] world = __checkVectorByVertex_world;// [2][3];
    var world0 = inv_cpara[0][0] * i_start_vertex.x * 10.0 + inv_cpara[0][1] * i_start_vertex.y * 10.0 + inv_cpara[0][2] * 10.0;// mat_a->m[0]*st[0]*10.0+
    var world1 = inv_cpara[1][0] * i_start_vertex.x * 10.0 + inv_cpara[1][1] * i_start_vertex.y * 10.0 + inv_cpara[1][2] * 10.0;// mat_a->m[3]*st[0]*10.0+
    var world2 = inv_cpara[2][0] * i_start_vertex.x * 10.0 + inv_cpara[2][1] * i_start_vertex.y * 10.0 + inv_cpara[2][2] * 10.0;// mat_a->m[6]*st[0]*10.0+
    var world3 = world0 + this.v1;
    var world4 = world1 + this.v2;
    var world5 = world2 + this.v3;
    // </Optimize>
    //final double[] camera = __checkVectorByVertex_camera;// [2][2];
    var cmat= this._projection_mat_ref;
    //h = cpara[2 * 4 + 0] * world0 + cpara[2 * 4 + 1] * world1 + cpara[2 * 4 + 2] * world2;
    h = cmat.m20 * world0 + cmat.m21 * world1 + cmat.m22 * world2;
    if (h == 0.0) {
      throw new NyARException();
    }
    //final double camera0 = (cpara[0 * 4 + 0] * world0 + cpara[0 * 4 + 1] * world1 + cpara[0 * 4 + 2] * world2) / h;
    //final double camera1 = (cpara[1 * 4 + 0] * world0 + cpara[1 * 4 + 1] * world1 + cpara[1 * 4 + 2] * world2) / h;
    var camera0 = (cmat.m00 * world0 + cmat.m01 * world1 + cmat.m02 * world2) / h;
    var camera1 = (cmat.m10 * world0 + cmat.m11 * world1 + cmat.m12 * world2) / h;
    //h = cpara[2 * 4 + 0] * world3 + cpara[2 * 4 + 1] * world4 + cpara[2 * 4 + 2] * world5;
    h = cmat.m20 * world3 + cmat.m21 * world4 + cmat.m22 * world5;
    if (h == 0.0) {
      throw new NyARException();
    }
    //final double camera2 = (cpara[0 * 4 + 0] * world3 + cpara[0 * 4 + 1] * world4 + cpara[0 * 4 + 2] * world5) / h;
    //final double camera3 = (cpara[1 * 4 + 0] * world3 + cpara[1 * 4 + 1] * world4 + cpara[1 * 4 + 2] * world5) / h;
    var camera2 = (cmat.m00 * world3 + cmat.m01 * world4 + cmat.m02 * world5) / h;
    var camera3 = (cmat.m10 * world3 + cmat.m11 * world4 + cmat.m12 * world5) / h;
    var v = (i_end_vertex.x - i_start_vertex.x) * (camera2 - camera0) + (i_end_vertex.y - i_start_vertex.y) * (camera3 - camera1);
    if (v < 0) {
      this.v1 = -this.v1;
      this.v2 = -this.v2;
      this.v3 = -this.v3;
    }
  },
  /**
   * int check_rotation( double rot[2][3] )
   * 2つのベクトル引数の調整をする？
   * @param i_r
   * @throws NyARException
   */
  checkRotation : function(io_vec1,io_vec2)
  {
    var w;
    var f;
    var vec10 = io_vec1.v1;
    var vec11 = io_vec1.v2;
    var vec12 = io_vec1.v3;
    var vec20 = io_vec2.v1;
    var vec21 = io_vec2.v2;
    var vec22 = io_vec2.v3;
    var vec30 = vec11 * vec22 - vec12 * vec21;
    var vec31 = vec12 * vec20 - vec10 * vec22;
    var vec32 = vec10 * vec21 - vec11 * vec20;
    w = Math.sqrt(vec30 * vec30 + vec31 * vec31 + vec32 * vec32);
    if (w == 0.0) {
      throw new NyARException();
    }
    vec30 /= w;
    vec31 /= w;
    vec32 /= w;
    var cb = vec10 * vec20 + vec11 * vec21 + vec12 * vec22;
    if (cb < 0){
      cb=-cb;//cb *= -1.0;
    }
    var ca = (Math.sqrt(cb + 1.0) + Math.sqrt(1.0 - cb)) * 0.5;
    if (vec31 * vec10 - vec11 * vec30 != 0.0) {
      f = 0;
    } else {
      if (vec32 * vec10 - vec12 * vec30 != 0.0) {
        w = vec11;vec11 = vec12;vec12 = w;
        w = vec31;vec31 = vec32;vec32 = w;
        f = 1;
      } else {
        w = vec10;vec10 = vec12;vec12 = w;
        w = vec30;vec30 = vec32;vec32 = w;
        f = 2;
      }
    }
    if (vec31 * vec10 - vec11 * vec30 == 0.0) {
      throw new NyARException();
    }
    var k1,k2,k3,k4;
    var a, b, c, d;
    var p1, q1, r1;
    var p2, q2, r2;
    var p3, q3, r3;
    var p4, q4, r4;
    k1 = (vec11 * vec32 - vec31 * vec12) / (vec31 * vec10 - vec11 * vec30);
    k2 = (vec31 * ca) / (vec31 * vec10 - vec11 * vec30);
    k3 = (vec10 * vec32 - vec30 * vec12) / (vec30 * vec11 - vec10 * vec31);
    k4 = (vec30 * ca) / (vec30 * vec11 - vec10 * vec31);
    a = k1 * k1 + k3 * k3 + 1;
    b = k1 * k2 + k3 * k4;
    c = k2 * k2 + k4 * k4 - 1;
    d = b * b - a * c;
    if (d < 0) {
      throw new NyARException();
    }
    r1 = (-b + Math.sqrt(d)) / a;
    p1 = k1 * r1 + k2;
    q1 = k3 * r1 + k4;
    r2 = (-b - Math.sqrt(d)) / a;
    p2 = k1 * r2 + k2;
    q2 = k3 * r2 + k4;
    if (f == 1) {
      w = q1;q1 = r1;r1 = w;
      w = q2;q2 = r2;r2 = w;
      w = vec11;vec11 = vec12;vec12 = w;
      w = vec31;vec31 = vec32;vec32 = w;
      f = 0;
    }
    if (f == 2) {
      w = p1;p1 = r1;r1 = w;
      w = p2;p2 = r2;r2 = w;
      w = vec10;vec10 = vec12;vec12 = w;
      w = vec30;vec30 = vec32;vec32 = w;
      f = 0;
    }
    if (vec31 * vec20 - vec21 * vec30 != 0.0) {
      f = 0;
    } else {
      if (vec32 * vec20 - vec22 * vec30 != 0.0) {
        w = vec21;vec21 = vec22;vec22 = w;
        w = vec31;vec31 = vec32;vec32 = w;
        f = 1;
      } else {
        w = vec20;vec20 = vec22;vec22 = w;
        w = vec30;vec30 = vec32;vec32 = w;
        f = 2;
      }
    }
    if (vec31 * vec20 - vec21 * vec30 == 0.0) {
      throw new NyARException();
    }
    k1 = (vec21 * vec32 - vec31 * vec22) / (vec31 * vec20 - vec21 * vec30);
    k2 = (vec31 * ca) / (vec31 * vec20 - vec21 * vec30);
    k3 = (vec20 * vec32 - vec30 * vec22) / (vec30 * vec21 - vec20 * vec31);
    k4 = (vec30 * ca) / (vec30 * vec21 - vec20 * vec31);
    a = k1 * k1 + k3 * k3 + 1;
    b = k1 * k2 + k3 * k4;
    c = k2 * k2 + k4 * k4 - 1;
    d = b * b - a * c;
    if (d < 0) {
      throw new NyARException();
    }
    r3 = (-b + Math.sqrt(d)) / a;
    p3 = k1 * r3 + k2;
    q3 = k3 * r3 + k4;
    r4 = (-b - Math.sqrt(d)) / a;
    p4 = k1 * r4 + k2;
    q4 = k3 * r4 + k4;
    if (f == 1) {
      w = q3;q3 = r3;r3 = w;
      w = q4;q4 = r4;r4 = w;
      w = vec21;vec21 = vec22;vec22 = w;
      w = vec31;vec31 = vec32;vec32 = w;
      f = 0;
    }
    if (f == 2) {
      w = p3;p3 = r3;r3 = w;
      w = p4;p4 = r4;r4 = w;
      w = vec20;vec20 = vec22;vec22 = w;
      w = vec30;vec30 = vec32;vec32 = w;
      f = 0;
    }
    var e1 = p1 * p3 + q1 * q3 + r1 * r3;
    if (e1 < 0) {
      e1 = -e1;
    }
    var e2 = p1 * p4 + q1 * q4 + r1 * r4;
    if (e2 < 0) {
      e2 = -e2;
    }
    var e3 = p2 * p3 + q2 * q3 + r2 * r3;
    if (e3 < 0) {
      e3 = -e3;
    }
    var e4 = p2 * p4 + q2 * q4 + r2 * r4;
    if (e4 < 0) {
      e4 = -e4;
    }
    if (e1 < e2) {
      if (e1 < e3) {
        if (e1 < e4) {
          io_vec1.v1 = p1;
          io_vec1.v2 = q1;
          io_vec1.v3 = r1;
          io_vec2.v1 = p3;
          io_vec2.v2 = q3;
          io_vec2.v3 = r3;
        } else {
          io_vec1.v1 = p2;
          io_vec1.v2 = q2;
          io_vec1.v3 = r2;
          io_vec2.v1 = p4;
          io_vec2.v2 = q4;
          io_vec2.v3 = r4;
        }
      } else {
        if (e3 < e4) {
          io_vec1.v1 = p2;
          io_vec1.v2 = q2;
          io_vec1.v3 = r2;
          io_vec2.v1 = p3;
          io_vec2.v2 = q3;
          io_vec2.v3 = r3;
        } else {
          io_vec1.v1 = p2;
          io_vec1.v2 = q2;
          io_vec1.v3 = r2;
          io_vec2.v1 = p4;
          io_vec2.v2 = q4;
          io_vec2.v3 = r4;
        }
      }
    } else {
      if (e2 < e3) {
        if (e2 < e4) {
          io_vec1.v1 = p1;
          io_vec1.v2 = q1;
          io_vec1.v3 = r1;
          io_vec2.v1 = p4;
          io_vec2.v2 = q4;
          io_vec2.v3 = r4;
        } else {
          io_vec1.v1 = p2;
          io_vec1.v2 = q2;
          io_vec1.v3 = r2;
          io_vec2.v1 = p4;
          io_vec2.v2 = q4;
          io_vec2.v3 = r4;
        }
      } else {
        if (e3 < e4) {
          io_vec1.v1 = p2;
          io_vec1.v2 = q2;
          io_vec1.v3 = r2;
          io_vec2.v1 = p3;
          io_vec2.v2 = q3;
          io_vec2.v3 = r3;
        } else {
          io_vec1.v1 = p2;
          io_vec1.v2 = q2;
          io_vec1.v3 = r2;
          io_vec2.v1 = p4;
          io_vec2.v2 = q4;
          io_vec2.v3 = r4;
        }
      }
    }
    return;
  }
})

INyARTransportVectorSolver = ASKlass('INyARTransportVectorSolver',
{
  set2dVertex : function(i_ref_vertex_2d,i_number_of_vertex){},
  /**
   * 画面座標群と3次元座標群から、平行移動量を計算します。
   * 2d座標系は、直前に実行したset2dVertexのものを使用します。
   * @param i_vertex_2d
   * 直前のset2dVertexコールで指定したものと同じものを指定してください。
   * @param i_vertex3d
   * 3次元空間の座標群を設定します。頂点の順番は、画面座標群と同じ順序で格納してください。
   * @param o_transfer
   * @throws NyARException
   */
  solveTransportVector : function(i_vertex3d, o_transfer){}
})


/**
 * 並進ベクトル[T]を３次元座標[b]と基点の回転済行列[M]から計算します。
 *
 * アルゴリズムは、ARToolKit 拡張現実プログラミング入門 の、P207のものです。
 *
 * 計算手順
 * [A]*[T]=bを、[A]T*[A]*[T]=[A]T*[b]にする。
 * set2dVertexで[A]T*[A]=[M]を計算して、Aの3列目の情報だけ保存しておく。
 * getTransportVectorで[M]*[T]=[A]T*[b]を連立方程式で解いて、[T]を得る。
 */
NyARTransportVectorSolver = ASKlass('NyARTransportVectorSolver', INyARTransportVectorSolver,
{
  _cx : null,
  _cy : null,
  _projection_mat : null,
  _nmber_of_vertex : 0,
  NyARTransportVectorSolver : function(i_projection_mat_ref,i_max_vertex)
  {
    this._projection_mat=i_projection_mat_ref;
    this._cx=new FloatVector(i_max_vertex);
    this._cy=new FloatVector(i_max_vertex);
    return;
  },
  _a00:0,_a01_10:0,_a02_20:0,_a11:0,_a12_21:0,_a22 : 0,
  /**
   * 画面上の座標群を指定します。
   * @param i_ref_vertex_2d
   * 歪み矯正済の画面上の頂点座標群への参照値を指定します。
   * @throws NyARException
   *
   */
  set2dVertex : function(i_ref_vertex_2d,i_number_of_vertex)
  {
    //3x2nと2n*3の行列から、最小二乗法計算するために3x3マトリクスを作る。
    //行列[A]の3列目のキャッシュ
    var cx=this._cx;
    var cy=this._cy;
    var m22;
    var p00=this._projection_mat.m00;
    var p01=this._projection_mat.m01;
    var p11=this._projection_mat.m11;
    var p12=this._projection_mat.m12;
    var p02=this._projection_mat.m02;
    var w1,w2,w3,w4;
    this._a00=i_number_of_vertex*p00*p00;
    this._a01_10=i_number_of_vertex*p00*p01;
    this._a11=i_number_of_vertex*(p01*p01+p11*p11);
    //[A]T*[A]の計算
    m22=0;
    w1=w2=0;
    for(var i=0;i<i_number_of_vertex;i++){
      //座標を保存しておく。
      w3=p02-(cx[i]=i_ref_vertex_2d[i].x);
      w4=p12-(cy[i]=i_ref_vertex_2d[i].y);
      w1+=w3;
      w2+=w4;
      m22+=w3*w3+w4*w4;
    }
    this._a02_20=w1*p00;
    this._a12_21=p01*w1+p11*w2;
    this._a22=m22;
    this._nmber_of_vertex=i_number_of_vertex;
    return;
  },
  /**
   * 画面座標群と3次元座標群から、平行移動量を計算します。
   * 2d座標系は、直前に実行したset2dVertexのものを使用します。
   * @param i_vertex_2d
   * 直前のset2dVertexコールで指定したものと同じものを指定してください。
   * @param i_vertex3d
   * 3次元空間の座標群を設定します。頂点の順番は、画面座標群と同じ順序で格納してください。
   * @param o_transfer
   * @throws NyARException
   */
  solveTransportVector : function(i_vertex3d,o_transfer)
  {
    var number_of_vertex=this._nmber_of_vertex;
    var p00=this._projection_mat.m00;
    var p01=this._projection_mat.m01;
    var p02=this._projection_mat.m02;
    var p11=this._projection_mat.m11;
    var p12=this._projection_mat.m12;
    //行列[A]の3列目のキャッシュ
    var cx=this._cx;
    var cy=this._cy;
    //回転行列を元座標の頂点群に適応
    //[A]T*[b]を計算
    var b1, b2, b3;
    b1 = b2 = b3 = 0;
    for(var i=0;i<number_of_vertex;i++)
    {
      var w1=i_vertex3d[i].z*cx[i]-p00*i_vertex3d[i].x-p01*i_vertex3d[i].y-p02*i_vertex3d[i].z;
      var w2=i_vertex3d[i].z*cy[i]-p11*i_vertex3d[i].y-p12*i_vertex3d[i].z;
      b1+=w1;
      b2+=w2;
      b3+=cx[i]*w1+cy[i]*w2;
    }
    //[A]T*[b]を計算
    b3=p02*b1+p12*b2-b3;//順番変えたらダメよ
    b2=p01*b1+p11*b2;
    b1=p00*b1;
    //([A]T*[A])*[T]=[A]T*[b]を方程式で解く。
    //a01とa10を0と仮定しても良いんじゃないかな？
    var a00=this._a00;
    var a01=this._a01_10;
    var a02=this._a02_20;
    var a11=this._a11;
    var a12=this._a12_21;
    var a22=this._a22;
    var t1=a22*b2-a12*b3;
    var t2=a12*b2-a11*b3;
    var t3=a01*b3-a02*b2;
    var t4=a12*a12-a11*a22;
    var t5=a02*a12-a01*a22;
    var t6=a02*a11-a01*a12;
    var det=a00*t4-a01*t5 + a02*t6;
    o_transfer.x= (a01*t1 - a02*t2 +b1*t4)/det;
    o_transfer.y=-(a00*t1 + a02*t3 +b1*t5)/det;
    o_transfer.z= (a00*t2 + a01*t3 +b1*t6)/det;
    return;
  }
})
