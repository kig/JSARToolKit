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
INyARCameraDistortionFactor = ASKlass('INyARCameraDistortionFactor',
{
  ideal2Observ : function(i_in,o_out){},
  ideal2ObservBatch : function(i_in,o_out,i_size){},
  observ2Ideal : function(ix,iy,o_point){},
  observ2IdealBatch : function(i_x_coord,i_y_coord,i_start,i_num,o_x_coord,o_y_coord){}
})

/**
 * カメラの歪み成分を格納するクラスと、補正関数群
 * http://www.hitl.washington.edu/artoolkit/Papers/ART02-Tutorial.pdf
 * 11ページを読むといいよ。
 *
 * x=x(xi-x0),y=s(yi-y0)
 * d^2=x^2+y^2
 * p=(1-fd^2)
 * xd=px+x0,yd=py+y0
 */
NyARCameraDistortionFactor = ASKlass('NyARCameraDistortionFactor', INyARCameraDistortionFactor,
{
  PD_LOOP : 3,
  _f0 : 0,//x0
  _f1 : 0,//y0
  _f2 : 0,//100000000.0*ｆ
  _f3 : 0,//s
  copyFrom : function(i_ref)
  {
    this._f0=i_ref._f0;
    this._f1=i_ref._f1;
    this._f2=i_ref._f2;
    this._f3=i_ref._f3;
    return;
  }
  /**
   * 配列の値をファクタ値としてセットする。
   * @param i_factor
   * 4要素以上の配列
   */
  ,setValue : function(i_factor)
  {
    this._f0=i_factor[0];
    this._f1=i_factor[1];
    this._f2=i_factor[2];
    this._f3=i_factor[3];
    return;
  }
  ,getValue : function(o_factor)
  {
    o_factor[0]=this._f0;
    o_factor[1]=this._f1;
    o_factor[2]=this._f2;
    o_factor[3]=this._f3;
    return;
  }
  ,changeScale : function(i_scale)
  {
    this._f0=this._f0*i_scale;// newparam->dist_factor[0] =source->dist_factor[0] *scale;
    this._f1=this._f1*i_scale;// newparam->dist_factor[1] =source->dist_factor[1] *scale;
    this._f2=this._f2/ (i_scale * i_scale);// newparam->dist_factor[2]=source->dist_factor[2]/ (scale*scale);
    //this.f3=this.f3;// newparam->dist_factor[3] =source->dist_factor[3];
    return;
  }
  /**
   * int arParamIdeal2Observ( const double dist_factor[4], const double ix,const double iy,double *ox, double *oy ) 関数の代替関数
   *
   * @param i_in
   * @param o_out
   */
  ,ideal2Observ : function(i_in,o_out)
  {
    var x = (i_in.x - this._f0) * this._f3;
    var y = (i_in.y - this._f1) * this._f3;
    if (x == 0.0 && y == 0.0) {
      o_out.x = this._f0;
      o_out.y = this._f1;
    } else {
      var d = 1.0 - this._f2 / 100000000.0 * (x * x + y * y);
      o_out.x = x * d + this._f0;
      o_out.y = y * d + this._f1;
    }
    return;
  }
  /**
   * ideal2Observをまとめて実行します。
   * @param i_in
   * @param o_out
   */
  ,ideal2ObservBatch : function(i_in, o_out ,i_size)
  {
    var x, y;
    var d0 = this._f0;
    var d1 = this._f1;
    var d3 = this._f3;
    var d2_w = this._f2 / 100000000.0;
    for (var i = 0; i < i_size; i++) {
      x = (i_in[i].x - d0) * d3;
      y = (i_in[i].y - d1) * d3;
      if (x == 0.0 && y == 0.0) {
        o_out[i].x = d0;
        o_out[i].y = d1;
      } else {
        var d = 1.0 - d2_w * (x * x + y * y);
        o_out[i].x = x * d + d0;
        o_out[i].y = y * d + d1;
      }
    }
    return;
  }
  /**
   * int arParamObserv2Ideal( const double dist_factor[4], const double ox,const double oy,double *ix, double *iy );
   *
   * @param ix
   * @param iy
   * @param ix
   * @param iy
   * @return
   */
  ,observ2Ideal : function(ix, iy, o_point)
  {
    var z02, z0, p, q, z, px, py, opttmp_1;
    var d0 = this._f0;
    var d1 = this._f1;
    px = ix - d0;
    py = iy - d1;
    p = this._f2 / 100000000.0;
    z02 = px * px + py * py;
    q = z0 = Math.sqrt(z02);// Optimize//q = z0 = Math.sqrt(px*px+ py*py);
    for (var i = 1;; i++) {
      if (z0 != 0.0) {
        // Optimize opttmp_1
        opttmp_1 = p * z02;
        z = z0 - ((1.0 - opttmp_1) * z0 - q) / (1.0 - 3.0 * opttmp_1);
        px = px * z / z0;
        py = py * z / z0;
      } else {
        px = 0.0;
        py = 0.0;
        break;
      }
      if (i == this.PD_LOOP) {
        break;
      }
      z02 = px * px + py * py;
      z0 = Math.sqrt(z02);// Optimize//z0 = Math.sqrt(px*px+ py*py);
    }
    o_point.x = px / this._f3 + d0;
    o_point.y = py / this._f3 + d1;
    return;
  }
  /**
   * 指定範囲のobserv2Idealをまとめて実行して、結果をo_idealに格納します。
   * @param i_x_coord
   * @param i_y_coord
   * @param i_start
   *            coord開始点
   * @param i_num
   *            計算数
   * @param o_ideal
   *            出力バッファ[i_num][2]であること。
   */
  ,observ2IdealBatch : function(i_x_coord,i_y_coord,i_start,i_num,o_x_coord,o_y_coord)
  {
    var z02, z0, q, z, px, py, opttmp_1;
    var d0 = this._f0;
    var d1 = this._f1;
    var d3 = this._f3;
    var p = this._f2 / 100000000.0;
    for (var j = 0; j < i_num; j++) {
      px = i_x_coord[i_start + j] - d0;
      py = i_y_coord[i_start + j] - d1;
      z02 = px * px + py * py;
      q = z0 = Math.sqrt(z02);// Optimize//q = z0 = Math.sqrt(px*px+py*py);
      for (var i = 1;; i++) {
        if (z0 != 0.0) {
          // Optimize opttmp_1
          opttmp_1 = p * z02;
          z = z0 - ((1.0 - opttmp_1) * z0 - q)/ (1.0 - 3.0 * opttmp_1);
          px = px * z / z0;
          py = py * z / z0;
        } else {
          px = 0.0;
          py = 0.0;
          break;
        }
        if (i == PD_LOOP) {
          break;
        }
        z02 = px * px + py * py;
        z0 = Math.sqrt(z02);// Optimize//z0 = Math.sqrt(px*px+ py*py);
      }
      o_x_coord[j] = px / d3 + d0;
      o_y_coord[j] = py / d3 + d1;
    }
    return;
  }
})
NyARObserv2IdealMap = ASKlass('NyARObserv2IdealMap',
{
  _stride : 0,
  _mapx : null,
  _mapy : null,
  NyARObserv2IdealMap : function(i_distfactor,i_screen_size)
  {
    var opoint=new NyARDoublePoint2d();
    this._mapx=new FloatVector(i_screen_size.w*i_screen_size.h);
    this._mapy=new FloatVector(i_screen_size.w*i_screen_size.h);
    this._stride=i_screen_size.w;
    var ptr=i_screen_size.h*i_screen_size.w-1;
    //歪みマップを構築
    for(var i=i_screen_size.h-1;i>=0;i--)
    {
      for(var i2=i_screen_size.w-1;i2>=0;i2--)
      {
        i_distfactor.observ2Ideal(i2,i, opoint);
        this._mapx[ptr]=opoint.x;
        this._mapy[ptr]=opoint.y;
        ptr--;
      }
    }
    return;
  }
  ,observ2Ideal : function(ix,iy,o_point)
  {
    var idx=ix+iy*this._stride;
    o_point.x=this._mapx[idx];
    o_point.y=this._mapy[idx];
    return;
  }
  ,observ2IdealBatch : function(i_x_coord,i_y_coord,i_start,i_num,o_x_coord,o_y_coord,i_out_start_index)
  {
    var idx;
    var ptr=i_out_start_index;
    var mapx=this._mapx;
    var mapy=this._mapy;
    var stride=this._stride;
    for (var j = 0; j < i_num; j++){
      idx=i_x_coord[i_start + j]+i_y_coord[i_start + j]*stride;
      o_x_coord[ptr]=mapx[idx];
      o_y_coord[ptr]=mapy[idx];
      ptr++;
    }
    return;
  }
})

NyARPerspectiveProjectionMatrix = ASKlass('NyARPerspectiveProjectionMatrix', NyARDoubleMatrix34,
{
  /*
   * static double dot( double a1, double a2, double a3,double b1, double b2,double b3 )
   */
  dot : function(a1,a2,a3,b1,b2,b3)
  {
    return (a1 * b1 + a2 * b2 + a3 * b3);
  }
  /* static double norm( double a, double b, double c ) */
  ,norm : function(a,b,c)
  {
    return Math.sqrt(a * a + b * b + c * c);
  }
  /**
   * int arParamDecompMat( double source[3][4], double cpara[3][4], double trans[3][4] ); 関数の置き換え Optimize STEP[754->665]
   *
   * @param o_cpara
   *            戻り引数。3x4のマトリクスを指定すること。
   * @param o_trans
   *            戻り引数。3x4のマトリクスを指定すること。
   * @return
   */
  ,decompMat : function(o_cpara,o_trans)
  {
    var r, c;
    var rem1, rem2, rem3;
    var c00,c01,c02,c03,c10,c11,c12,c13,c20,c21,c22,c23;
    if (this.m23>= 0) {// if( source[2][3] >= 0 ) {
      // <Optimize>
      // for(int r = 0; r < 3; r++ ){
      // for(int c = 0; c < 4; c++ ){
      // Cpara[r][c]=source[r][c];//Cpara[r][c] = source[r][c];
      // }
      // }
      c00=this.m00;
      c01=this.m01;
      c02=this.m02;
      c03=this.m03;
      c10=this.m10;
      c11=this.m11;
      c12=this.m12;
      c13=this.m13;
      c20=this.m20;
      c21=this.m21;
      c22=this.m22;
      c23=this.m23;
    } else {
      // <Optimize>
      // for(int r = 0; r < 3; r++ ){
      // for(int c = 0; c < 4; c++ ){
      // Cpara[r][c]=-source[r][c];//Cpara[r][c] = -(source[r][c]);
      // }
      // }
      c00=-this.m00;
      c01=-this.m01;
      c02=-this.m02;
      c03=-this.m03;
      c10=-this.m10;
      c11=-this.m11;
      c12=-this.m12;
      c13=-this.m13;
      c20=-this.m20;
      c21=-this.m21;
      c22=-this.m22;
      c23=-this.m23;
    }
    var cpara= o_cpara.getArray();
    var trans= o_trans.getArray();
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 4; c++) {
        cpara[r][c] = 0.0;// cpara[r][c] = 0.0;
      }
    }
    cpara[2][2] = this.norm(c20, c21, c22);// cpara[2][2] =norm( Cpara[2][0],Cpara[2][1],Cpara[2][2]);
    trans[2][0] = c20 / cpara[2][2];// trans[2][0] = Cpara[2][0] /cpara[2][2];
    trans[2][1] = c21 / cpara[2][2];// trans[2][1] = Cpara[2][1] / cpara[2][2];
    trans[2][2] = c22 / cpara[2][2];// trans[2][2] =Cpara[2][2] /cpara[2][2];
    trans[2][3] = c23 / cpara[2][2];// trans[2][3] =Cpara[2][3] /cpara[2][2];
    cpara[1][2] = this.dot(trans[2][0], trans[2][1], trans[2][2], c10, c11, c12);// cpara[1][2]=dot(trans[2][0],trans[2][1],trans[2][2],Cpara[1][0],Cpara[1][1],Cpara[1][2]);
    rem1 = c10 - cpara[1][2] * trans[2][0];// rem1 =Cpara[1][0] -cpara[1][2] *trans[2][0];
    rem2 = c11 - cpara[1][2] * trans[2][1];// rem2 =Cpara[1][1] -cpara[1][2] *trans[2][1];
    rem3 = c12 - cpara[1][2] * trans[2][2];// rem3 =Cpara[1][2] -cpara[1][2] *trans[2][2];
    cpara[1][1] = this.norm(rem1, rem2, rem3);// cpara[1][1] = norm( rem1,// rem2, rem3 );
    trans[1][0] = rem1 / cpara[1][1];// trans[1][0] = rem1 / cpara[1][1];
    trans[1][1] = rem2 / cpara[1][1];// trans[1][1] = rem2 / cpara[1][1];
    trans[1][2] = rem3 / cpara[1][1];// trans[1][2] = rem3 / cpara[1][1];
    cpara[0][2] = this.dot(trans[2][0], trans[2][1], trans[2][2], c00, c01, c02);// cpara[0][2] =dot(trans[2][0], trans[2][1],trans[2][2],Cpara[0][0],Cpara[0][1],Cpara[0][2]);
    cpara[0][1] = this.dot(trans[1][0], trans[1][1], trans[1][2], c00, c01, c02);// cpara[0][1]=dot(trans[1][0],trans[1][1],trans[1][2],Cpara[0][0],Cpara[0][1],Cpara[0][2]);
    rem1 = c00 - cpara[0][1] * trans[1][0] - cpara[0][2]* trans[2][0];// rem1 = Cpara[0][0] - cpara[0][1]*trans[1][0]- cpara[0][2]*trans[2][0];
    rem2 = c01 - cpara[0][1] * trans[1][1] - cpara[0][2]* trans[2][1];// rem2 = Cpara[0][1] - cpara[0][1]*trans[1][1]- cpara[0][2]*trans[2][1];
    rem3 = c02 - cpara[0][1] * trans[1][2] - cpara[0][2]* trans[2][2];// rem3 = Cpara[0][2] - cpara[0][1]*trans[1][2] - cpara[0][2]*trans[2][2];
    cpara[0][0] = this.norm(rem1, rem2, rem3);// cpara[0][0] = norm( rem1,rem2, rem3 );
    trans[0][0] = rem1 / cpara[0][0];// trans[0][0] = rem1 / cpara[0][0];
    trans[0][1] = rem2 / cpara[0][0];// trans[0][1] = rem2 / cpara[0][0];
    trans[0][2] = rem3 / cpara[0][0];// trans[0][2] = rem3 / cpara[0][0];
    trans[1][3] = (c13 - cpara[1][2] * trans[2][3])/ cpara[1][1];// trans[1][3] = (Cpara[1][3] -cpara[1][2]*trans[2][3]) / cpara[1][1];
    trans[0][3] = (c03 - cpara[0][1] * trans[1][3] - cpara[0][2]* trans[2][3])/ cpara[0][0];// trans[0][3] = (Cpara[0][3] -cpara[0][1]*trans[1][3]-cpara[0][2]*trans[2][3]) / cpara[0][0];
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 3; c++) {
        cpara[r][c] /= cpara[2][2];// cpara[r][c] /= cpara[2][2];
      }
    }
    return;
  }
  /**
   * int arParamChangeSize( ARParam *source, int xsize, int ysize, ARParam *newparam );
   * Matrixのスケールを変換します。
   * @param i_scale
   *
   */
  ,changeScale : function(i_scale)
  {
    this.m00=this.m00*i_scale;
    this.m10=this.m10*i_scale;
    this.m01=this.m01*i_scale;
    this.m11=this.m11*i_scale;
    this.m02=this.m02*i_scale;
    this.m12=this.m12*i_scale;
    this.m03=this.m03*i_scale;
    this.m13=this.m13*i_scale;
    //for (int i = 0; i < 4; i++) {
    //  array34[0 * 4 + i] = array34[0 * 4 + i] * scale;// newparam->mat[0][i]=source->mat[0][i]* scale;
    //  array34[1 * 4 + i] = array34[1 * 4 + i] * scale;// newparam->mat[1][i]=source->mat[1][i]* scale;
    //  array34[2 * 4 + i] = array34[2 * 4 + i];// newparam->mat[2][i] = source->mat[2][i];
    //}
    return;
  }
  /**
   * 現在の行列で３次元座標を射影変換します。
   * @param i_3dvertex
   * @param o_2d
   */
  ,projectionConvert_NyARDoublePoint3d : function(i_3dvertex,o_2d)
  {
    var w=i_3dvertex.z*this.m22;
    o_2d.x=(i_3dvertex.x*this.m00+i_3dvertex.y*this.m01+i_3dvertex.z*this.m02)/w;
    o_2d.y=(i_3dvertex.y*this.m11+i_3dvertex.z*this.m12)/w;
    return;
  }
  ,projectionConvert_Number : function(i_x,i_y,i_z,o_2d)
  {
    var w=i_z*this.m22;
    o_2d.x=(i_x*this.m00+i_y*this.m01+i_z*this.m02)/w;
    o_2d.y=(i_y*this.m11+i_z*this.m12)/w;
    return;
  }
})


/**
 * typedef struct { int xsize, ysize; double mat[3][4]; double dist_factor[4]; } ARParam;
 * NyARの動作パラメータを格納するクラス
 *
 */
NyARParam = ASKlass('NyARParam',
{
  _screen_size : new NyARIntSize(),
  SIZE_OF_PARAM_SET : 4 + 4 + (3 * 4 * 8) + (4 * 8),
  _dist : new NyARCameraDistortionFactor(),
  _projection_matrix : new NyARPerspectiveProjectionMatrix(),
  getScreenSize : function()
  {
    return this._screen_size;
  }
  ,getPerspectiveProjectionMatrix : function()
  {
    return this._projection_matrix;
  }
  ,getDistortionFactor : function()
  {
    return this._dist;
  }
  /**
   * Copy the perspective projection matrix to the given m_projection FloatVector GL camera matrix.
   */
  ,copyCameraMatrix : function(m_projection, NEAR_CLIP, FAR_CLIP) {
    var trans_mat = new FLARMat(3,4);
    var icpara_mat = new FLARMat(3,4);
    var p = ArrayUtil.createJaggedArray(3, 3);
    var q = ArrayUtil.createJaggedArray(4, 4);
    var i = 0;
    var j = 0;
    var size = this.getScreenSize();
    var  width = size.w;
    var height = size.h;

    this.getPerspectiveProjectionMatrix().decompMat(icpara_mat, trans_mat);

    var icpara = icpara_mat.getArray();
    var trans = trans_mat.getArray();
    for (i = 0; i < 4; i++) {
      icpara[1][i] = (height - 1) * (icpara[2][i]) - icpara[1][i];
    }

    for(i = 0; i < 3; i++) {
      for(j = 0; j < 3; j++) {
        p[i][j] = icpara[i][j] / icpara[2][2];
      }
    }
    q[0][0] = (2.0 * p[0][0] / (width - 1));
    q[0][1] = (2.0 * p[0][1] / (width - 1));
    q[0][2] = -((2.0 * p[0][2] / (width - 1))  - 1.0);
    q[0][3] = 0.0;

    q[1][0] = 0.0;
    q[1][1] = -(2.0 * p[1][1] / (height - 1));
    q[1][2] = -((2.0 * p[1][2] / (height - 1)) - 1.0);
    q[1][3] = 0.0;

    q[2][0] = 0.0;
    q[2][1] = 0.0;
    q[2][2] = -(FAR_CLIP + NEAR_CLIP) / (NEAR_CLIP - FAR_CLIP);
    q[2][3] = 2.0 * FAR_CLIP * NEAR_CLIP / (NEAR_CLIP - FAR_CLIP);

    q[3][0] = 0.0;
    q[3][1] = 0.0;
    q[3][2] = 1.0;
    q[3][3] = 0.0;

    for (i = 0; i < 4; i++) { // Row.
      // First 3 columns of the current row.
      for (j = 0; j < 3; j++) { // Column.
        m_projection[j*4 + i] =
          q[i][0] * trans[0][j] +
          q[i][1] * trans[1][j] +
          q[i][2] * trans[2][j];
      }
      // Fourth column of the current row.
      m_projection[i+4*3]=
        q[i][0] * trans[0][3] +
        q[i][1] * trans[1][3] +
        q[i][2] * trans[2][3] +
        q[i][3];
    }
  }
  /**
   *
   * @param i_factor
   * NyARCameraDistortionFactorにセットする配列を指定する。要素数は4であること。
   * @param i_projection
   * NyARPerspectiveProjectionMatrixセットする配列を指定する。要素数は12であること。
   */
  ,setValue : function(i_factor,i_projection)
  {
    this._dist.setValue(i_factor);
    this._projection_matrix.setValue(i_projection);
    return;
  }
  /**
   * int arParamChangeSize( ARParam *source, int xsize, int ysize, ARParam *newparam );
   * 関数の代替関数 サイズプロパティをi_xsize,i_ysizeに変更します。
   * @param i_xsize
   * @param i_ysize
   * @param newparam
   * @return
   *
   */
  ,changeScreenSize : function(i_xsize,i_ysize)
  {
    var scale = i_xsize / this._screen_size.w;// scale = (double)xsize / (double)(source->xsize);
    //スケールを変更
    this._dist.changeScale(scale);
    this._projection_matrix.changeScale(scale);
    this._screen_size.w = i_xsize;// newparam->xsize = xsize;
    this._screen_size.h = i_ysize;// newparam->ysize = ysize;
    return;
  }
  ,loadARParam : function(i_stream)
  {
    var tmp = new FloatVector(12);//new double[12];
    i_stream.endian = Endian.BIG_ENDIAN;
    this._screen_size.w = i_stream.readInt();//bb.getInt();
    this._screen_size.h = i_stream.readInt();//bb.getInt();
    //double値を12個読み込む
    var i;
    for(i = 0; i < 12; i++){
      tmp[i] = i_stream.readDouble();//bb.getDouble();
    }
    //Projectionオブジェクトにセット
    this._projection_matrix.setValue(tmp);
    //double値を4個読み込む
    for (i = 0; i < 4; i++) {
      tmp[i] = i_stream.readDouble();//bb.getDouble();
    }
    //Factorオブジェクトにセット
    this._dist.setValue(tmp);
    return;
  }
})
