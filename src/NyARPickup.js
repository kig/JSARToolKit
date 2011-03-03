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
INyARColorPatt = ASKlass('INyARColorPatt', INyARRgbRaster,
{
  /**
   * ラスタイメージからi_square部分のカラーパターンを抽出して、thisメンバに格納します。
   *
   * @param image
   * Source raster object.
   * ----
   * 抽出元のラスタオブジェクト
   * @param i_vertexs
   * Vertexes of the square. Number of element must be 4.
   * ----
   * 射影変換元の４角形を構成する頂点群頂群。要素数は4であること。
   * @return
   * True if sucessfull; otherwise false.
   * ----
   * ラスターの取得に成功するとTRUE/失敗するとFALSE
   * @throws NyARException
   */
//  public boolean pickFromRaster(INyARRgbRaster image, NyARSquare i_square) throws NyARException;
  pickFromRaster : function(image,i_vertexs){}
})
NyARColorPatt_Perspective = ASKlass('NyARColorPatt_Perspective', INyARColorPatt,
{
  _patdata : null,
  _pickup_lt : new NyARIntPoint2d(),
  _resolution : 0,
  _size : null,
  _perspective_gen : null,
  _pixelreader : null,
  LOCAL_LT : 1,
  BUFFER_FORMAT : NyARBufferType.INT1D_X8R8G8B8_32,
  initializeInstance : function(i_width,i_height,i_point_per_pix)
  {
    NyAS3Utils.assert(i_width>2 && i_height>2);
    this._resolution=i_point_per_pix;
    this._size=new NyARIntSize(i_width,i_height);
    this._patdata = new IntVector(i_height*i_width);
    this._pixelreader=new NyARRgbPixelReader_INT1D_X8R8G8B8_32(this._patdata,this._size);
    return;
  }
  /**
   * 例えば、64
   * @param i_width
   * 取得画像の解像度幅
   * @param i_height
   * 取得画像の解像度高さ
   */
  /**
   * 例えば、64
   * @param i_width
   * 取得画像の解像度幅
   * @param i_height
   * 取得画像の解像度高さ
   * @param i_point_per_pix
   * 1ピクセルあたりの縦横サンプリング数。2なら2x2=4ポイントをサンプリングする。
   * @param i_edge_percentage
   * エッジ幅の割合(ARToolKit標準と同じなら、25)
   */
  ,NyARColorPatt_Perspective : function(i_width,i_height,i_point_per_pix,i_edge_percentage)
  {
    if (i_edge_percentage == null) i_edge_percentage = -1;
    if (i_edge_percentage == -1) {
      this.initializeInstance(i_width,i_height,i_point_per_pix);
      this.setEdgeSize(0,0,i_point_per_pix);
    }else{
      //入力制限
      this.initializeInstance(i_width,i_height,i_point_per_pix);
      this.setEdgeSizeByPercent(i_edge_percentage, i_edge_percentage, i_point_per_pix);
    }
    return;
  }
  /**
   * 矩形領域のエッジサイズを指定します。
   * エッジの計算方法は以下の通りです。
   * 1.マーカ全体を(i_x_edge*2+width)x(i_y_edge*2+height)の解像度でパラメタを計算します。
   * 2.ピクセルの取得開始位置を(i_x_edge/2,i_y_edge/2)へ移動します。
   * 3.開始位置から、width x height個のピクセルを取得します。
   *
   * ARToolKit標準マーカの場合は、width/2,height/2を指定してください。
   * @param i_x_edge
   * @param i_y_edge
   */
  ,setEdgeSize : function(i_x_edge,i_y_edge,i_resolution)
  {
    NyAS3Utils.assert(i_x_edge>=0);
    NyAS3Utils.assert(i_y_edge>=0);
    //Perspectiveパラメタ計算器を作成
    this._perspective_gen=new NyARPerspectiveParamGenerator_O1(
      this.LOCAL_LT,this.LOCAL_LT,
      (i_x_edge*2+this._size.w)*i_resolution,
      (i_y_edge*2+this._size.h)*i_resolution);
    //ピックアップ開始位置を計算
    this._pickup_lt.x=i_x_edge*i_resolution+this.LOCAL_LT;
    this._pickup_lt.y=i_y_edge*i_resolution+this.LOCAL_LT;
    return;
  }
  ,setEdgeSizeByPercent : function(i_x_percent,i_y_percent,i_resolution)
  {
    NyAS3Utils.assert(i_x_percent>=0);
    NyAS3Utils.assert(i_y_percent>=0);
    this.setEdgeSize(this._size.w*i_x_percent/50,this._size.h*i_y_percent/50,i_resolution);
    return;
  }
  ,getWidth : function()
  {
    return this._size.w;
  }
  ,getHeight : function()
  {
    return this._size.h;
  }
  ,getSize : function()
  {
    return   this._size;
  }
  ,getRgbPixelReader : function()
  {
    return this._pixelreader;
  }
  ,getBuffer : function()
  {
    return this._patdata;
  }
  ,hasBuffer : function()
  {
    return this._patdata!=null;
  }
  ,wrapBuffer : function(i_ref_buf)
  {
    NyARException.notImplement();
  }
  ,getBufferType : function()
  {
    return BUFFER_FORMAT;
  }
  ,isEqualBufferType : function(i_type_value)
  {
    return BUFFER_FORMAT==i_type_value;
  },
  __pickFromRaster_rgb_tmp : new IntVector(3),
  __pickFromRaster_cpara : new FloatVector(8),
  /**
   * @see INyARColorPatt#pickFromRaster
   */
  pickFromRaster : function(image,i_vertexs)
  {
    //遠近法のパラメータを計算
    var cpara = this.__pickFromRaster_cpara;
    if (!this._perspective_gen.getParam(i_vertexs, cpara)) {
      return false;
    }
    var resolution=this._resolution;
    var img_x = image.getWidth();
    var img_y = image.getHeight();
    var res_pix=resolution*resolution;
    var rgb_tmp = this.__pickFromRaster_rgb_tmp;
    //ピクセルリーダーを取得
    var reader =image.getRgbPixelReader();
    var p=0;
    for(var iy=0;iy<this._size.h*resolution;iy+=resolution){
      //解像度分の点を取る。
      for(var ix=0;ix<this._size.w*resolution;ix+=resolution){
        var r,g,b;
        r=g=b=0;
        for(var i2y=iy;i2y<iy+resolution;i2y++){
          var cy=this._pickup_lt.y+i2y;
          for(var i2x=ix;i2x<ix+resolution;i2x++){
            //1ピクセルを作成
            var cx=this._pickup_lt.x+i2x;
            var d=cpara[6]*cx+cpara[7]*cy+1.0;
            var x=toInt((cpara[0]*cx+cpara[1]*cy+cpara[2])/d);
            var y=toInt((cpara[3]*cx+cpara[4]*cy+cpara[5])/d);
            if(x<0){x=0;}
            if(x>=img_x){x=img_x-1;}
            if(y<0){y=0;}
            if(y>=img_y){y=img_y-1;}
            reader.getPixel(x, y, rgb_tmp);
            r+=rgb_tmp[0];
            g+=rgb_tmp[1];
            b+=rgb_tmp[2];
          }
        }
        r/=res_pix;
        g/=res_pix;
        b/=res_pix;
        this._patdata[p]=((r&0xff)<<16)|((g&0xff)<<8)|((b&0xff));
        p++;
      }
    }
      //ピクセル問い合わせ
      //ピクセルセット
    return true;
  }
})
NyARColorPatt_Perspective_O2 = ASKlass('NyARColorPatt_Perspective_O2', NyARColorPatt_Perspective,
{
  _pickup : null,
  NyARColorPatt_Perspective_O2 : function(i_width,i_height,i_resolution,i_edge_percentage)
  {
    NyARColorPatt_Perspective.initialize.call(this,i_width,i_height,i_resolution,i_edge_percentage);
    switch(i_resolution){
    case 1:
      this._pickup=new NyARPickFromRaster_1(this._pickup_lt,this._size);
      break;
    case 2:
      this._pickup=new NyARPickFromRaster_2x(this._pickup_lt,this._size);
      break;
    case 4:
      this._pickup=new NyARPickFromRaster_4x(this._pickup_lt,this._size);
      break;
    default:
      this._pickup=new NyARPickFromRaster_N(this._pickup_lt,i_resolution,this._size);
    }
    return;
  }
  /**
   * @see INyARColorPatt#pickFromRaster
   */
  ,pickFromRaster : function(image ,i_vertexs)
  {
    //遠近法のパラメータを計算
    var cpara = this.__pickFromRaster_cpara;
    if (!this._perspective_gen.getParam(i_vertexs, cpara)) {
      return false;
    }
    this._pickup.pickFromRaster(cpara, image,this._patdata);
    return true;
  }
})

IpickFromRaster_Impl = ASKlass('IpickFromRaster_Impl',
{
  pickFromRaster : function(i_cpara,image,o_patt){}
})



/**
 * チェックデジット:4127936236942444153655776299710081208144715171590159116971715177917901890204024192573274828522936312731813388371037714083
 *
 */
NyARPickFromRaster_1 = ASKlass('NyARPickFromRaster_1', IpickFromRaster_Impl,
{
  _size_ref : null,
  _lt_ref : null,
  NyARPickFromRaster_1 : function(i_lt,i_source_size)
  {
    this._lt_ref=i_lt;
    this._size_ref=i_source_size;
    this._rgb_temp=new IntVector(i_source_size.w*3);
    this._rgb_px=new IntVector(i_source_size.w);
    this._rgb_py=new IntVector(i_source_size.w);
    return;
  },
  _rgb_temp : null,
  _rgb_px : null,
  _rgb_py : null,
  pickFromRaster : function(i_cpara, image, o_patt)
  {
    var d0,m0;
    var x,y;
    var img_x = image.getWidth();
    var img_y = image.getHeight();
    var patt_w=this._size_ref.w;
    var rgb_tmp = this._rgb_temp;
    var rgb_px=this._rgb_px;
    var rgb_py=this._rgb_py;
    var cp0=i_cpara[0];
    var cp3=i_cpara[3];
    var cp6=i_cpara[6];
    var cp1=i_cpara[1];
    var cp4=i_cpara[4];
    var cp7=i_cpara[7];
    var pick_y=this._lt_ref.y;
    var pick_x=this._lt_ref.x;
    //ピクセルリーダーを取得
    var reader=image.getRgbPixelReader();
    var p=0;
    var cp0cx0,cp3cx0;
    var cp1cy_cp20=cp1*pick_y+i_cpara[2]+cp0*pick_x;
    var cp4cy_cp50=cp4*pick_y+i_cpara[5]+cp3*pick_x;
    var cp7cy_10=cp7*pick_y+1.0+cp6*pick_x;
    for(var iy=this._size_ref.h-1;iy>=0;iy--){
      m0=1/(cp7cy_10);
      d0=-cp6/(cp7cy_10*(cp7cy_10+cp6));
      cp0cx0=cp1cy_cp20;
      cp3cx0=cp4cy_cp50;
      //ピックアップシーケンス
      //0番目のピクセル(検査対象)をピックアップ
      var ix;
      for(ix=patt_w-1;ix>=0;ix--){
        //1ピクセルを作成
        x=rgb_px[ix]=toInt(cp0cx0*m0);
        y=rgb_py[ix]=toInt(cp3cx0*m0);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[ix]=0;}else if(x>=img_x){rgb_px[ix]=img_x-1;}
          if(y<0){rgb_py[ix]=0;}else if(y>=img_y){rgb_py[ix]=img_y-1;}
        }
        cp0cx0+=cp0;
        cp3cx0+=cp3;
        m0+=d0;
      }
      cp1cy_cp20+=cp1;
      cp4cy_cp50+=cp4;
      cp7cy_10+=cp7;
      reader.getPixelSet(rgb_px, rgb_py,patt_w, rgb_tmp);
      for(ix=patt_w-1;ix>=0;ix--){
        var idx=ix*3;
        o_patt[p]=(rgb_tmp[idx]<<16)|(rgb_tmp[idx+1]<<8)|((rgb_tmp[idx+2]&0xff));
        p++;
      }
    }
    return;
  }
})
/*
* PROJECT: NyARToolkitAS3
* --------------------------------------------------------------------------------
* This work is based on the original ARToolKit developed by
*   Hirokazu Kato
*   Mark Billinghurst
*   HITLab, University of Washington, Seattle
* http://www.hitl.washington.edu/artoolkit/
*
* The NyARToolkitAS3 is AS3 edition ARToolKit class library.
* Copyright (C)2010 Ryo Iizuka
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
*  http://nyatla.jp/nyatoolkit/
*  <airmail(at)ebony.plala.or.jp> or <nyatla(at)nyatla.jp>
*
*/




/**
 * 2x2
 * チェックデジット:207585881161241401501892422483163713744114324414474655086016467027227327958629279571017
 *
 */
NyARPickFromRaster_2x = ASKlass('NyARPickFromRaster_2x', IpickFromRaster_Impl,
{
  _size_ref : null,
  _lt_ref : null,
  NyARPickFromRaster_2x : function(i_lt,i_source_size)
  {
    this._lt_ref=i_lt;
    this._size_ref=i_source_size;
    this._rgb_temp=new IntVector(i_source_size.w*4*3);
    this._rgb_px=new IntVector(i_source_size.w*4);
    this._rgb_py=new IntVector(i_source_size.w*4);
    return;
  },
  _rgb_temp : null,
  _rgb_px : null,
  _rgb_py : null,
  pickFromRaster : function(i_cpara,image,o_patt)
  {
    var d0,m0,d1,m1;
    var x,y;
    var img_x = image.getWidth();
    var img_y = image.getHeight();
    var patt_w=this._size_ref.w;
    var rgb_tmp = this._rgb_temp;
    var rgb_px=this._rgb_px;
    var rgb_py=this._rgb_py;
    var cp0=i_cpara[0];
    var cp3=i_cpara[3];
    var cp6=i_cpara[6];
    var cp1=i_cpara[1];
    var cp4=i_cpara[4];
    var cp7=i_cpara[7];
    var pick_y=this._lt_ref.y;
    var pick_x=this._lt_ref.x;
    //ピクセルリーダーを取得
    var reader=image.getRgbPixelReader();
    var p=0;
    var cp0cx0,cp3cx0;
    var cp1cy_cp20=cp1*pick_y+i_cpara[2]+cp0*pick_x;
    var cp4cy_cp50=cp4*pick_y+i_cpara[5]+cp3*pick_x;
    var cp7cy_10=cp7*pick_y+1.0+cp6*pick_x;
    var cp0cx1,cp3cx1;
    var cp1cy_cp21=cp1cy_cp20+cp1;
    var cp4cy_cp51=cp4cy_cp50+cp4;
    var cp7cy_11=cp7cy_10+cp7;
    var cw0=cp1+cp1;
    var cw7=cp7+cp7;
    var cw4=cp4+cp4;
    for(var iy=this._size_ref.h-1;iy>=0;iy--){
      cp0cx0=cp1cy_cp20;
      cp3cx0=cp4cy_cp50;
      cp0cx1=cp1cy_cp21;
      cp3cx1=cp4cy_cp51;
      m0=1.0/(cp7cy_10);
      d0=-cp6/(cp7cy_10*(cp7cy_10+cp6));
      m1=1.0/(cp7cy_11);
      d1=-cp6/(cp7cy_11*(cp7cy_11+cp6));
      var n=patt_w*2*2-1;
      var ix;
      for(ix=patt_w*2-1;ix>=0;ix--){
        //[n,0]
        x=rgb_px[n]=toInt(cp0cx0*m0);
        y=rgb_py[n]=toInt(cp3cx0*m0);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[n]=0;}else if(x>=img_x){rgb_px[n]=img_x-1;}
          if(y<0){rgb_py[n]=0;}else if(y>=img_y){rgb_py[n]=img_y-1;}
        }
        cp0cx0+=cp0;
        cp3cx0+=cp3;
        m0+=d0;
        n--;
        //[n,1]
        x=rgb_px[n]=toInt(cp0cx1*m1);
        y=rgb_py[n]=toInt(cp3cx1*m1);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[n]=0;}else if(x>=img_x){rgb_px[n]=img_x-1;}
          if(y<0){rgb_py[n]=0;}else if(y>=img_y){rgb_py[n]=img_y-1;}
        }
        cp0cx1+=cp0;
        cp3cx1+=cp3;
        m1+=d1;
        n--;
      }
      cp7cy_10+=cw7;
      cp7cy_11+=cw7;
      cp1cy_cp20+=cw0;
      cp4cy_cp50+=cw4;
      cp1cy_cp21+=cw0;
      cp4cy_cp51+=cw4;
      reader.getPixelSet(rgb_px, rgb_py,patt_w*4, rgb_tmp);
      for(ix=patt_w-1;ix>=0;ix--){
        var idx=ix*12;//3*2*2
        var r=(rgb_tmp[idx+0]+rgb_tmp[idx+3]+rgb_tmp[idx+6]+rgb_tmp[idx+ 9])/4;
        var g=(rgb_tmp[idx+1]+rgb_tmp[idx+4]+rgb_tmp[idx+7]+rgb_tmp[idx+10])/4;
        var b=(rgb_tmp[idx+2]+rgb_tmp[idx+5]+rgb_tmp[idx+8]+rgb_tmp[idx+11])/4;
        o_patt[p]=(r<<16)|(g<<8)|((b&0xff));
        p++;
      }
    }
    return;
  }
})
/*
* PROJECT: NyARToolkitAS3
* --------------------------------------------------------------------------------
* This work is based on the original ARToolKit developed by
*   Hirokazu Kato
*   Mark Billinghurst
*   HITLab, University of Washington, Seattle
* http://www.hitl.washington.edu/artoolkit/
*
* The NyARToolkitAS3 is AS3 edition ARToolKit class library.
* Copyright (C)2010 Ryo Iizuka
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
*  http://nyatla.jp/nyatoolkit/
*  <airmail(at)ebony.plala.or.jp> or <nyatla(at)nyatla.jp>
*
*/




/**
 * 4x4
 *
 */
NyARPickFromRaster_4x = ASKlass('NyARPickFromRaster_4x', IpickFromRaster_Impl,
{
  _size_ref : null,
  _lt_ref : null,
  NyARPickFromRaster_4x : function(i_lt,i_source_size)
  {
    this._lt_ref=i_lt;
    this._size_ref=i_source_size;
    this._rgb_temp=new IntVector(4*4*3);
    this._rgb_px=new IntVector(4*4);
    this._rgb_py=new IntVector(4*4);
    return;
  },
  _rgb_temp : null,
  _rgb_px : null,
  _rgb_py : null,
  pickFromRaster : function(i_cpara, image, o_patt)
  {
    var x,y;
    var d,m;
    var cp6cx,cp0cx,cp3cx;
    var rgb_px=this._rgb_px;
    var rgb_py=this._rgb_py;
    var r,g,b;
    //遠近法のパラメータを計算
    var img_x = image.getWidth();
    var img_y = image.getHeight();
    var rgb_tmp = this._rgb_temp;
    var cp0=i_cpara[0];
    var cp3=i_cpara[3];
    var cp6=i_cpara[6];
    var cp1=i_cpara[1];
    var cp2=i_cpara[2];
    var cp4=i_cpara[4];
    var cp5=i_cpara[5];
    var cp7=i_cpara[7];
    var pick_lt_x=this._lt_ref.x;
    //ピクセルリーダーを取得
    var reader=image.getRgbPixelReader();
    var p=0;
    var py=this._lt_ref.y;
    for(var iy=this._size_ref.h-1;iy>=0;iy--,py+=4){
      var cp1cy_cp2_0=cp1*py+cp2;
      var cp4cy_cp5_0=cp4*py+cp5;
      var cp7cy_1_0  =cp7*py+1.0;
      var cp1cy_cp2_1=cp1cy_cp2_0+cp1;
      var cp1cy_cp2_2=cp1cy_cp2_1+cp1;
      var cp1cy_cp2_3=cp1cy_cp2_2+cp1;
      var cp4cy_cp5_1=cp4cy_cp5_0+cp4;
      var cp4cy_cp5_2=cp4cy_cp5_1+cp4;
      var cp4cy_cp5_3=cp4cy_cp5_2+cp4;
      var px=pick_lt_x;
      //解像度分の点を取る。
      for(var ix=this._size_ref.w-1;ix>=0;ix--,px+=4){
        cp6cx=cp6*px;
        cp0cx=cp0*px;
        cp3cx=cp3*px;
        cp6cx+=cp7cy_1_0;
        m=1/cp6cx;
        d=-cp7/((cp6cx+cp7)*cp6cx);
        //1ピクセルを作成[0,0]
        x=rgb_px[0]=toInt((cp0cx+cp1cy_cp2_0)*m);
        y=rgb_py[0]=toInt((cp3cx+cp4cy_cp5_0)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[0]=0;} else if(x>=img_x){rgb_px[0]=img_x-1;}
          if(y<0){rgb_py[0]=0;} else if(y>=img_y){rgb_py[0]=img_y-1;}
        }
        //1ピクセルを作成[0,1]
        m+=d;
        x=rgb_px[4]=toInt((cp0cx+cp1cy_cp2_1)*m);
        y=rgb_py[4]=toInt((cp3cx+cp4cy_cp5_1)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[4]=0;}else if(x>=img_x){rgb_px[4]=img_x-1;}
          if(y<0){rgb_py[4]=0;}else if(y>=img_y){rgb_py[4]=img_y-1;}
        }
        //1ピクセルを作成[0,2]
        m+=d;
        x=rgb_px[8]=toInt((cp0cx+cp1cy_cp2_2)*m);
        y=rgb_py[8]=toInt((cp3cx+cp4cy_cp5_2)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[8]=0;}else if(x>=img_x){rgb_px[8]=img_x-1;}
          if(y<0){rgb_py[8]=0;}else if(y>=img_y){rgb_py[8]=img_y-1;}
        }
        //1ピクセルを作成[0,3]
        m+=d;
        x=rgb_px[12]=toInt((cp0cx+cp1cy_cp2_3)*m);
        y=rgb_py[12]=toInt((cp3cx+cp4cy_cp5_3)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[12]=0;}else if(x>=img_x){rgb_px[12]=img_x-1;}
          if(y<0){rgb_py[12]=0;}else if(y>=img_y){rgb_py[12]=img_y-1;}
        }
        cp6cx+=cp6;
        cp0cx+=cp0;
        cp3cx+=cp3;
        m=1/cp6cx;
        d=-cp7/((cp6cx+cp7)*cp6cx);
        //1ピクセルを作成[1,0]
        x=rgb_px[1]=toInt((cp0cx+cp1cy_cp2_0)*m);
        y=rgb_py[1]=toInt((cp3cx+cp4cy_cp5_0)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[1]=0;}else if(x>=img_x){rgb_px[1]=img_x-1;}
          if(y<0){rgb_py[1]=0;}else if(y>=img_y){rgb_py[1]=img_y-1;}
        }
        //1ピクセルを作成[1,1]
        m+=d;
        x=rgb_px[5]=toInt((cp0cx+cp1cy_cp2_1)*m);
        y=rgb_py[5]=toInt((cp3cx+cp4cy_cp5_1)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[5]=0;}else if(x>=img_x){rgb_px[5]=img_x-1;}
          if(y<0){rgb_py[5]=0;}else if(y>=img_y){rgb_py[5]=img_y-1;}
        }
        //1ピクセルを作成[1,2]
        m+=d;
        x=rgb_px[9]=toInt((cp0cx+cp1cy_cp2_2)*m);
        y=rgb_py[9]=toInt((cp3cx+cp4cy_cp5_2)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[9]=0;}else if(x>=img_x){rgb_px[9]=img_x-1;}
          if(y<0){rgb_py[9]=0;}else if(y>=img_y){rgb_py[9]=img_y-1;}
        }
        //1ピクセルを作成[1,3]
        m+=d;
        x=rgb_px[13]=toInt((cp0cx+cp1cy_cp2_3)*m);
        y=rgb_py[13]=toInt((cp3cx+cp4cy_cp5_3)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[13]=0;}else if(x>=img_x){rgb_px[13]=img_x-1;}
          if(y<0){rgb_py[13]=0;}else if(y>=img_y){rgb_py[13]=img_y-1;}
        }
        cp6cx+=cp6;
        cp0cx+=cp0;
        cp3cx+=cp3;
        m=1/cp6cx;
        d=-cp7/((cp6cx+cp7)*cp6cx);
        //1ピクセルを作成[2,0]
        x=rgb_px[2]=toInt((cp0cx+cp1cy_cp2_0)*m);
        y=rgb_py[2]=toInt((cp3cx+cp4cy_cp5_0)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[2]=0;}else if(x>=img_x){rgb_px[2]=img_x-1;}
          if(y<0){rgb_py[2]=0;}else if(y>=img_y){rgb_py[2]=img_y-1;}
        }
        //1ピクセルを作成[2,1]
        m+=d;
        x=rgb_px[6]=toInt((cp0cx+cp1cy_cp2_1)*m);
        y=rgb_py[6]=toInt((cp3cx+cp4cy_cp5_1)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[6]=0;}else if(x>=img_x){rgb_px[6]=img_x-1;}
          if(y<0){rgb_py[6]=0;}else if(y>=img_y){rgb_py[6]=img_y-1;}
        }
        //1ピクセルを作成[2,2]
        m+=d;
        x=rgb_px[10]=toInt((cp0cx+cp1cy_cp2_2)*m);
        y=rgb_py[10]=toInt((cp3cx+cp4cy_cp5_2)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[10]=0;}else if(x>=img_x){rgb_px[10]=img_x-1;}
          if(y<0){rgb_py[10]=0;}else if(y>=img_y){rgb_py[10]=img_y-1;}
        }
        //1ピクセルを作成[2,3](ここ計算ずれします。)
        m+=d;
        x=rgb_px[14]=toInt((cp0cx+cp1cy_cp2_3)*m);
        y=rgb_py[14]=toInt((cp3cx+cp4cy_cp5_3)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[14]=0;}else if(x>=img_x){rgb_px[14]=img_x-1;}
          if(y<0){rgb_py[14]=0;}else if(y>=img_y){rgb_py[14]=img_y-1;}
        }
        cp6cx+=cp6;
        cp0cx+=cp0;
        cp3cx+=cp3;
        m=1/cp6cx;
        d=-cp7/((cp6cx+cp7)*cp6cx);
        //1ピクセルを作成[3,0]
        x=rgb_px[3]=toInt((cp0cx+cp1cy_cp2_0)*m);
        y=rgb_py[3]=toInt((cp3cx+cp4cy_cp5_0)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[3]=0;}else if(x>=img_x){rgb_px[3]=img_x-1;}
          if(y<0){rgb_py[3]=0;}else if(y>=img_y){rgb_py[3]=img_y-1;}
        }
        //1ピクセルを作成[3,1]
        m+=d;
        x=rgb_px[7]=toInt((cp0cx+cp1cy_cp2_1)*m);
        y=rgb_py[7]=toInt((cp3cx+cp4cy_cp5_1)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[7]=0;}else if(x>=img_x){rgb_px[7]=img_x-1;}
          if(y<0){rgb_py[7]=0;}else if(y>=img_y){rgb_py[7]=img_y-1;}
        }
        //1ピクセルを作成[3,2]
        m+=d;
        x=rgb_px[11]=toInt((cp0cx+cp1cy_cp2_2)*m);
        y=rgb_py[11]=toInt((cp3cx+cp4cy_cp5_2)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[11]=0;}else if(x>=img_x){rgb_px[11]=img_x-1;}
          if(y<0){rgb_py[11]=0;}else if(y>=img_y){rgb_py[11]=img_y-1;}
        }
        //1ピクセルを作成[3,3]
        m+=d;
        x=rgb_px[15]=toInt((cp0cx+cp1cy_cp2_3)*m);
        y=rgb_py[15]=toInt((cp3cx+cp4cy_cp5_3)*m);
        if(x<0||x>=img_x||y<0||y>=img_y){
          if(x<0){rgb_px[15]=0;}else if(x>=img_x){rgb_px[15]=img_x-1;}
          if(y<0){rgb_py[15]=0;}else if(y>=img_y){rgb_py[15]=img_y-1;}
        }
        reader.getPixelSet(rgb_px, rgb_py,4*4, rgb_tmp);
        r=(rgb_tmp[ 0]+rgb_tmp[ 3]+rgb_tmp[ 6]+rgb_tmp[ 9]+rgb_tmp[12]+rgb_tmp[15]+rgb_tmp[18]+rgb_tmp[21]+rgb_tmp[24]+rgb_tmp[27]+rgb_tmp[30]+rgb_tmp[33]+rgb_tmp[36]+rgb_tmp[39]+rgb_tmp[42]+rgb_tmp[45])/16;
        g=(rgb_tmp[ 1]+rgb_tmp[ 4]+rgb_tmp[ 7]+rgb_tmp[10]+rgb_tmp[13]+rgb_tmp[16]+rgb_tmp[19]+rgb_tmp[22]+rgb_tmp[25]+rgb_tmp[28]+rgb_tmp[31]+rgb_tmp[34]+rgb_tmp[37]+rgb_tmp[40]+rgb_tmp[43]+rgb_tmp[46])/16;
        b=(rgb_tmp[ 2]+rgb_tmp[ 5]+rgb_tmp[ 8]+rgb_tmp[11]+rgb_tmp[14]+rgb_tmp[17]+rgb_tmp[20]+rgb_tmp[23]+rgb_tmp[26]+rgb_tmp[29]+rgb_tmp[32]+rgb_tmp[35]+rgb_tmp[38]+rgb_tmp[41]+rgb_tmp[44]+rgb_tmp[47])/16;
        o_patt[p]=((r&0xff)<<16)|((g&0xff)<<8)|((b&0xff));
        p++;
      }
    }
    return;
  }
})
/*
* PROJECT: NyARToolkitAS3
* --------------------------------------------------------------------------------
* This work is based on the original ARToolKit developed by
*   Hirokazu Kato
*   Mark Billinghurst
*   HITLab, University of Washington, Seattle
* http://www.hitl.washington.edu/artoolkit/
*
* The NyARToolkitAS3 is AS3 edition ARToolKit class library.
* Copyright (C)2010 Ryo Iizuka
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
*  http://nyatla.jp/nyatoolkit/
*  <airmail(at)ebony.plala.or.jp> or <nyatla(at)nyatla.jp>
*
*/




/**
 * 汎用ピックアップ関数
 *
 */
NyARPickFromRaster_N = ASKlass('NyARPickFromRaster_N', IpickFromRaster_Impl,
{
  _resolution : 0,
  _size_ref : null,
  _lt_ref : null,
  NyARPickFromRaster_N : function(i_lt,i_resolution,i_source_size)
  {
    this._lt_ref=i_lt;
    this._resolution=i_resolution;
    this._size_ref=i_source_size;
    this._rgb_temp=new IntVector(i_resolution*i_resolution*3);
    this._rgb_px=new IntVector(i_resolution*i_resolution);
    this._rgb_py=new IntVector(i_resolution*i_resolution);
    this._cp1cy_cp2=new FloatVector(i_resolution);
    this._cp4cy_cp5=new FloatVector(i_resolution);
    this._cp7cy_1=new FloatVector(i_resolution);
    return;
  },
  _rgb_temp : null,
  _rgb_px : null,
  _rgb_py : null,
  _cp1cy_cp2 : null,
  _cp4cy_cp5 : null,
  _cp7cy_1 : null,
  pickFromRaster : function(i_cpara,image,o_patt)
  {
    var i2x,i2y;//プライム変数
    var x,y;
    var w;
    var r,g,b;
    var resolution=this._resolution;
    var res_pix=resolution*resolution;
    var img_x = image.getWidth();
    var img_y = image.getHeight();
    var rgb_tmp = this._rgb_temp;
    var rgb_px=this._rgb_px;
    var rgb_py=this._rgb_py;
    var cp1cy_cp2=this._cp1cy_cp2;
    var cp4cy_cp5=this._cp4cy_cp5;
    var cp7cy_1=this._cp7cy_1;
    var cp0=i_cpara[0];
    var cp3=i_cpara[3];
    var cp6=i_cpara[6];
    var cp1=i_cpara[1];
    var cp2=i_cpara[2];
    var cp4=i_cpara[4];
    var cp5=i_cpara[5];
    var cp7=i_cpara[7];
    var pick_y=this._lt_ref.y;
    var pick_x=this._lt_ref.x;
    //ピクセルリーダーを取得
    var reader=image.getRgbPixelReader();
    var p=0;
    for(var iy=0;iy<this._size_ref.h*resolution;iy+=resolution){
      w=pick_y+iy;
      cp1cy_cp2[0]=cp1*w+cp2;
      cp4cy_cp5[0]=cp4*w+cp5;
      cp7cy_1[0]=cp7*w+1.0;
      for(i2y=1;i2y<resolution;i2y++){
        cp1cy_cp2[i2y]=cp1cy_cp2[i2y-1]+cp1;
        cp4cy_cp5[i2y]=cp4cy_cp5[i2y-1]+cp4;
        cp7cy_1[i2y]=cp7cy_1[i2y-1]+cp7;
      }
      //解像度分の点を取る。
      for(var ix=0;ix<this._size_ref.w*resolution;ix+=resolution){
        var n=0;
        w=pick_x+ix;
        for(i2y=resolution-1;i2y>=0;i2y--){
          var cp0cx=cp0*w+cp1cy_cp2[i2y];
          var cp6cx=cp6*w+cp7cy_1[i2y];
          var cp3cx=cp3*w+cp4cy_cp5[i2y];
          var m=1/(cp6cx);
          var d=-cp6/(cp6cx*(cp6cx+cp6));
          var m2=cp0cx*m;
          var m3=cp3cx*m;
          var d2=cp0cx*d+cp0*(m+d);
          var d3=cp3cx*d+cp3*(m+d);
          for(i2x=resolution-1;i2x>=0;i2x--){
            //1ピクセルを作成
            x=rgb_px[n]=toInt(m2);
            y=rgb_py[n]=toInt(m3);
            if(x<0||x>=img_x||y<0||y>=img_y){
              if(x<0){rgb_px[n]=0;}else if(x>=img_x){rgb_px[n]=img_x-1;}
              if(y<0){rgb_py[n]=0;}else if(y>=img_y){rgb_py[n]=img_y-1;}
            }
            n++;
            m2+=d2;
            m3+=d3;
          }
        }
        reader.getPixelSet(rgb_px, rgb_py,res_pix, rgb_tmp);
        r=g=b=0;
        for(var i=res_pix*3-1;i>0;){
          b+=rgb_tmp[i--];
          g+=rgb_tmp[i--];
          r+=rgb_tmp[i--];
        }
        r/=res_pix;
        g/=res_pix;
        b/=res_pix;
        o_patt[p]=((r&0xff)<<16)|((g&0xff)<<8)|((b&0xff));
        p++;
      }
    }
    return;
  }
})
