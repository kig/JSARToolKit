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
*   ilmari.heikkinen@gmail.com
*
*/




INyARDoubleMatrix = Klass({

  /**
    * 配列の内容を行列に設定する。
    * 遅いので余り使わないでね。
    * @param o_value
    */
  setValue : function(o_value){}, // double[]

  /**
    * 行列の内容を配列に返す。
    * 遅いので余り使わないでね。
    * @param o_value
    */
  getValue : function(o_value){} // double[]
})



NyARDoubleMatrix22 = Klass(INyARDoubleMatrix,
{
  m00 : 0,
  m01 : 0,
  m10 : 0,
  m11 : 0,
  /**
    * 遅いからあんまり使わないでね。
    */
  setValue : function(i_value)
  {
    this.m00=i_value[0];
    this.m01=i_value[1];
    this.m10=i_value[3];
    this.m11=i_value[4];
    return;
  }
  /**
    * 遅いからあんまり使わないでね。
    */
  ,getValue : function(o_value)
  {
    o_value[0]=this.m00;
    o_value[1]=this.m01;
    o_value[3]=this.m10;
    o_value[4]=this.m11;
    return;
  }
  ,inverse : function(i_src)
  {
    var a11,a12,a21,a22;
    a11=i_src.m00;
    a12=i_src.m01;
    a21=i_src.m10;
    a22=i_src.m11;
    var det=a11*a22-a12*a21;
    if(det==0){
      return false;
    }
    det=1/det;
    this.m00=a22*det;
    this.m01=-a12*det;
    this.m10=-a21*det;
    this.m11=a11*det;
    return true;
  }
})







NyARDoubleMatrix33 = Klass( INyARDoubleMatrix,
{
  m00 : 0,
  m01 : 0,
  m02 : 0,
  m10 : 0,
  m11 : 0,
  m12 : 0,
  m20 : 0,
  m21 : 0,
  m22 : 0,
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARDoubleMatrix33();
    }
    return ret;
  }
  /**
    * 遅いからあんまり使わないでね。
    */
  ,setValue : function(i_value)
  {
    this.m00=i_value[0];
    this.m01=i_value[1];
    this.m02=i_value[2];
    this.m10=i_value[3];
    this.m11=i_value[4];
    this.m12=i_value[5];
    this.m20=i_value[6];
    this.m21=i_value[7];
    this.m22=i_value[8];
    return;
  }
  ,setValue_NyARDoubleMatrix33 : function(i_value)
  {
    this.m00=i_value.m00;
    this.m01=i_value.m01;
    this.m02=i_value.m02;
    this.m10=i_value.m10;
    this.m11=i_value.m11;
    this.m12=i_value.m12;
    this.m20=i_value.m20;
    this.m21=i_value.m21;
    this.m22=i_value.m22;
    return;
  }
  /**
    * 遅いからあんまり使わないでね。
    */
  ,getValue : function(o_value)
  {
    o_value[0]=this.m00;
    o_value[1]=this.m01;
    o_value[2]=this.m02;
    o_value[3]=this.m10;
    o_value[4]=this.m11;
    o_value[5]=this.m12;
    o_value[6]=this.m20;
    o_value[7]=this.m21;
    o_value[8]=this.m22;
    return;
  }
  ,inverse : function(i_src)
  {
    var a11,a12,a13,a21,a22,a23,a31,a32,a33;
    var b11,b12,b13,b21,b22,b23,b31,b32,b33;
    a11=i_src.m00;a12=i_src.m01;a13=i_src.m02;
    a21=i_src.m10;a22=i_src.m11;a23=i_src.m12;
    a31=i_src.m20;a32=i_src.m21;a33=i_src.m22;

    b11=a22*a33-a23*a32;
    b12=a32*a13-a33*a12;
    b13=a12*a23-a13*a22;

    b21=a23*a31-a21*a33;
    b22=a33*a11-a31*a13;
    b23=a13*a21-a11*a23;

    b31=a21*a32-a22*a31;
    b32=a31*a12-a32*a11;
    b33=a11*a22-a12*a21;

    var det_1=a11*b11+a21*b12+a31*b13;
    if(det_1==0){
      return false;
    }
    det_1=1/det_1;

    this.m00=b11*det_1;
    this.m01=b12*det_1;
    this.m02=b13*det_1;

    this.m10=b21*det_1;
    this.m11=b22*det_1;
    this.m12=b23*det_1;

    this.m20=b31*det_1;
    this.m21=b32*det_1;
    this.m22=b33*det_1;

    return true;
  }
  /**
    * この関数は、0-PIの間で値を返します。
    * @param o_out
    */
  ,getZXYAngle : function(o_out)
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
  }
  ,setZXYAngle_NyARDoublePoint3d : function(i_angle)
  {
    this.setZXYAngle_Number(i_angle.x,i_angle.y,i_angle.z);
    return;
  }
  ,setZXYAngle_Number : function(i_x,i_y,i_z)
  {
    var sina = Math.sin(i_x);
    var cosa = Math.cos(i_x);
    var sinb = Math.sin(i_y);
    var cosb = Math.cos(i_y);
    var sinc = Math.sin(i_z);
    var cosc = Math.cos(i_z);
    this.m00 = cosc * cosb - sinc * sina * sinb;
    this.m01 = -sinc * cosa;
    this.m02 = cosc * sinb + sinc * sina * cosb;
    this.m10 = sinc * cosb + cosc * sina * sinb;
    this.m11 = cosc * cosa;
    this.m12 = sinc * sinb - cosc * sina * cosb;
    this.m20 = -cosa * sinb;
    this.m21 = sina;
    this.m22 = cosb * cosa;
    return;
  }
  /**
    * 回転行列を適応して座標変換します。
    * @param i_angle
    * @param o_out
    */
  ,transformVertex_NyARDoublePoint3d : function(i_position,o_out)
  {
    transformVertex_double(i_position.x,i_position.y,i_position.z,o_out);
    return;
  }

  ,transformVertex_double : function(i_x,i_y,i_z,o_out)
  {
    o_out.x=this.m00*i_x+this.m01*i_y+this.m02*i_z;
    o_out.y=this.m10*i_x+this.m11*i_y+this.m12*i_z;
    o_out.z=this.m20*i_x+this.m21*i_y+this.m22*i_z;
    return;
  }
})





NyARDoubleMatrix34 = Klass( INyARDoubleMatrix,
{

  m00 : 0,
  m01 : 0,
  m02 : 0,
  m03 : 0,
  m10 : 0,
  m11 : 0,
  m12 : 0,
  m13 : 0,
  m20 : 0,
  m21 : 0,
  m22 : 0,
  m23 : 0,

  setValue : function(i_value)
  {
    this.m00 = i_value[0];
    this.m01 = i_value[1];
    this.m02 = i_value[2];
    this.m03 = i_value[3];
    this.m10 = i_value[4];
    this.m11 = i_value[5];
    this.m12 = i_value[6];
    this.m13 = i_value[7];
    this.m20 = i_value[8];
    this.m21 = i_value[9];
    this.m22 = i_value[10];
    this.m23 = i_value[11];
    return;
  }
  ,setValue_NyARDoubleMatrix34 : function(i_value)
  {
    this.m00=i_value.m00;
    this.m01=i_value.m01;
    this.m02=i_value.m02;
    this.m03=i_value.m03;
    this.m10=i_value.m10;
    this.m11=i_value.m11;
    this.m12=i_value.m12;
    this.m13=i_value.m13;
    this.m20=i_value.m20;
    this.m21=i_value.m21;
    this.m22=i_value.m22;
    this.m23=i_value.m23;
    return;
  }

  ,getValue : function(o_value)
  {
    o_value[0] = this.m00;
    o_value[1] = this.m01;
    o_value[2] = this.m02;
    o_value[3] = this.m03;
    o_value[4] = this.m10;
    o_value[5] = this.m11;
    o_value[6] = this.m12;
    o_value[7] = this.m13;
    o_value[8] = this.m20;
    o_value[9] = this.m21;
    o_value[10] = this.m22;
    o_value[11] = this.m23;
    return;
  }
})



NyARDoubleMatrix44 = Klass( INyARDoubleMatrix,
{
  m00 : 0,
  m01 : 0,
  m02 : 0,
  m03 : 0,
  m10 : 0,
  m11 : 0,
  m12 : 0,
  m13 : 0,
  m20 : 0,
  m21 : 0,
  m22 : 0,
  m23 : 0,
  m30 : 0,
  m31 : 0,
  m32 : 0,
  m33 : 0,
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARDoubleMatrix44();
    }
    return ret;
  }
  /**
    * 遅いからあんまり使わないでね。
    */
  ,setValue : function(i_value)
  {
    this.m00=i_value[ 0];
    this.m01=i_value[ 1];
    this.m02=i_value[ 2];
    this.m03=i_value[ 3];
    this.m10=i_value[ 4];
    this.m11=i_value[ 5];
    this.m12=i_value[ 6];
    this.m13=i_value[ 7];
    this.m20=i_value[ 8];
    this.m21=i_value[ 9];
    this.m22=i_value[10];
    this.m23=i_value[11];
    this.m30=i_value[12];
    this.m31=i_value[13];
    this.m32=i_value[14];
    this.m33=i_value[15];
    return;
  }
  /**
    * 遅いからあんまり使わないでね。
    */
  ,getValue : function(o_value)
  {
    o_value[ 0]=this.m00;
    o_value[ 1]=this.m01;
    o_value[ 2]=this.m02;
    o_value[ 3]=this.m03;
    o_value[ 4]=this.m10;
    o_value[ 5]=this.m11;
    o_value[ 6]=this.m12;
    o_value[ 7]=this.m13;
    o_value[ 8]=this.m20;
    o_value[ 9]=this.m21;
    o_value[10]=this.m22;
    o_value[11]=this.m23;
    o_value[12]=this.m30;
    o_value[13]=this.m31;
    o_value[14]=this.m32;
    o_value[15]=this.m33;
    return;
  }
  ,inverse : function(i_src)
  {
    var a11,a12,a13,a14,a21,a22,a23,a24,a31,a32,a33,a34,a41,a42,a43,a44;
    var b11,b12,b13,b14,b21,b22,b23,b24,b31,b32,b33,b34,b41,b42,b43,b44;
    var t1,t2,t3,t4,t5,t6;
    a11=i_src.m00;a12=i_src.m01;a13=i_src.m02;a14=i_src.m03;
    a21=i_src.m10;a22=i_src.m11;a23=i_src.m12;a24=i_src.m13;
    a31=i_src.m20;a32=i_src.m21;a33=i_src.m22;a34=i_src.m23;
    a41=i_src.m30;a42=i_src.m31;a43=i_src.m32;a44=i_src.m33;

    t1=a33*a44-a34*a43;
    t2=a34*a42-a32*a44;
    t3=a32*a43-a33*a42;
    t4=a34*a41-a31*a44;
    t5=a31*a43-a33*a41;
    t6=a31*a42-a32*a41;

    b11=a22*t1+a23*t2+a24*t3;
    b21=-(a23*t4+a24*t5+a21*t1);
    b31=a24*t6-a21*t2+a22*t4;
    b41=-(a21*t3-a22*t5+a23*t6);

    t1=a43*a14-a44*a13;
    t2=a44*a12-a42*a14;
    t3=a42*a13-a43*a12;
    t4=a44*a11-a41*a14;
    t5=a41*a13-a43*a11;
    t6=a41*a12-a42*a11;

    b12=-(a32*t1+a33*t2+a34*t3);
    b22=a33*t4+a34*t5+a31*t1;
    b32=-(a34*t6-a31*t2+a32*t4);
    b42=a31*t3-a32*t5+a33*t6;

    t1=a13*a24-a14*a23;
    t2=a14*a22-a12*a24;
    t3=a12*a23-a13*a22;
    t4=a14*a21-a11*a24;
    t5=a11*a23-a13*a21;
    t6=a11*a22-a12*a21;

    b13=a42*t1+a43*t2+a44*t3;
    b23=-(a43*t4+a44*t5+a41*t1);
    b33=a44*t6-a41*t2+a42*t4;
    b43=-(a41*t3-a42*t5+a43*t6);

    t1=a23*a34-a24*a33;
    t2=a24*a32-a22*a34;
    t3=a22*a33-a23*a32;
    t4=a24*a31-a21*a34;
    t5=a21*a33-a23*a31;
    t6=a21*a32-a22*a31;

    b14=-(a12*t1+a13*t2+a14*t3);
    b24=a13*t4+a14*t5+a11*t1;
    b34=-(a14*t6-a11*t2+a12*t4);
    b44=a11*t3-a12*t5+a13*t6;

    var det_1=(a11*b11+a21*b12+a31*b13+a41*b14);
    if(det_1==0){
      return false;
    }
    det_1=1/det_1;

    this.m00=b11*det_1;
    this.m01=b12*det_1;
    this.m02=b13*det_1;
    this.m03=b14*det_1;

    this.m10=b21*det_1;
    this.m11=b22*det_1;
    this.m12=b23*det_1;
    this.m13=b24*det_1;

    this.m20=b31*det_1;
    this.m21=b32*det_1;
    this.m22=b33*det_1;
    this.m23=b34*det_1;

    this.m30=b41*det_1;
    this.m31=b42*det_1;
    this.m32=b43*det_1;
    this.m33=b44*det_1;

    return true;
  }
})





/**
  * スタック型の可変長配列。
  * 配列には実体を格納します。
  *
  * 注意事項
  * JavaのGenericsの制限突破を狙ったものの、Vector.&lt;*&gt;では、不具合が多いため、Vector.&lt;Object&gt;に変更
  * いくつかの場所でエラーがでる場合がありますが、コンパイルオプションなどで、
  * strict = false を設定して回避してください。
  * 根本修正は次バージョン以降で対応する予定です。
  */
NyARObjectStack = Klass(
{
  _items : null,

  _length : 0,

  /**
    * 最大ARRAY_MAX個の動的割り当てバッファを準備する。
    *
    *
    * @param i_array
    * @param i_element_type
    */
  initialize : function(i_length)
  {
    //領域確保
    i_length = toInt(i_length);
    this._items = this.createArray(i_length);
    //使用中個数をリセット
    this._length = 0;
    return;
  }

  /**
    * どのような配列(Vector)を格納するかを決める場所。
    * この関数を上書きしてください。
    *
    */
  ,createArray : function(i_length)
  {
    throw new NyARException();
  }

  /**
    * 新しい領域を予約します。
    * @return
    * 失敗するとnull
    * @throws NyARException
    */
  ,prePush : function()
  {
    // 必要に応じてアロケート
    if (this._length >= this._items.length){
      return null;
    }
    // 使用領域を+1して、予約した領域を返す。
    var ret = this._items[this._length];
    this._length++;
    return ret;
  }

  /**
    * スタックを初期化します。
    * @param i_reserv_length
    * 使用済みにするサイズ
    * @return
    */
  ,init : function(i_reserv_length)
  {
    // 必要に応じてアロケート
    if (i_reserv_length >= this._items.length){
      throw new NyARException();
    }
    this._length=i_reserv_length;
  }

  /**
    * 見かけ上の要素数を1減らして、そのオブジェクトを返します。
    * 返却したオブジェクトの内容は、次回のpushまで有効です。
    * @return
    */
  ,pop : function()
  {
    NyAS3Utils.assert(this._length>=1);
    this._length--;
    return this._items[this._length];
  }

  /**
    * 見かけ上の要素数をi_count個減らします。
    * @param i_count
    * @return
    */
  ,pops : function(i_count)
  {
    NyAS3Utils.assert(this._length>=i_count);
    this._length-=i_count;
    return;
  }

  /**
    * 配列を返します。
    *
    * @return
    */
  ,getArray : function()
  {
    return this._items;
  }

  ,getItem : function(i_index)
  {
    return this._items[i_index];
  }

  /**
    * 配列の見かけ上の要素数を返却します。
    * @return
    */
  ,getLength : function()
  {
    return this._length;
  }

  /**
    * 見かけ上の要素数をリセットします。
    */
  ,clear : function()
  {
    this._length = 0;
  }
})

/**
  * ...
  * @author
  */
NyARIntPointStack = Klass( NyARObjectStack,
{
  initialize : function(i_length)
  {
    NyARObjectStack.initialize.call(this, i_length);
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(i_length);
    for (var i =0; i < i_length; i++){
      ret[i] = new NyARIntPoint2d();
    }
    return ret;
  }

})







//	import jp.nyatla.nyartoolkit.as3.core.types.*;

NyARIntRectStack = Klass( //NyARObjectStack,
{
  _items : null,

  _length : null,

  initialize : function(i_length)
  {
    //領域確保
    this._items = this.createArray(i_length);
    //使用中個数をリセット
    this._length = 0;
    return;
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(i_length);
    for (var i =0; i < i_length; i++){
      ret[i] = new  NyARIntRect();
    }
    return ret;
  }
  /**
    * 新しい領域を予約します。
    * @return
    * 失敗するとnull
    * @throws NyARException
    */
  ,prePush : function()
  {
    // 必要に応じてアロケート
    if (this._length >= this._items.length){
      return null;
    }
    // 使用領域を+1して、予約した領域を返す。
    var ret = this._items[this._length];
    this._length++;
    return ret;
  }

  /**
    * スタックを初期化します。
    * @param i_reserv_length
    * 使用済みにするサイズ
    * @return
    */
  ,init : function(i_reserv_length)
  {
    // 必要に応じてアロケート
    if (i_reserv_length >= this._items.length){
      throw new NyARException();
    }
    this._length=i_reserv_length;
  }

  /**
    * 見かけ上の要素数を1減らして、そのオブジェクトを返します。
    * 返却したオブジェクトの内容は、次回のpushまで有効です。
    * @return
    */
  ,pop : function()
  {
    NyAS3Utils.assert(this._length>=1);
    this._length--;
    return this._items[this._length];
  }

  /**
    * 見かけ上の要素数をi_count個減らします。
    * @param i_count
    * @return
    */
  ,pops : function(i_count)
  {
    NyAS3Utils.assert(this._length>=i_count);
    this._length-=i_count;
    return;
  }

  /**
    * 配列を返します。
    *
    * @return
    */
  ,getArray : function()
  {
    return this._items;
  }

  ,getItem : function(i_index)
  {
    return this._items[i_index];
  }

  /**
    * 配列の見かけ上の要素数を返却します。
    * @return
    */
  ,getLength : function()
  {
    return this._length;
  }

  /**
    * 見かけ上の要素数をリセットします。
    */
  ,clear : function()
  {
    this._length = 0;
  }
})









NyARBufferType = Klass(
  (function() {
    var T_BYTE1D =0x00010000;
    var T_INT2D  =0x00020000;
    var T_SHORT1D=0x00030000;
    var T_INT1D  =0x00040000;
    var T_OBJECT =0x00100000;
    var T_USER   =0x00FF0000;

    return ({
      //  24-31(8)予約
      //  16-27(8)型ID
      //      00:無効/01[]/02[][]/03[]
      //  08-15(8)ビットフォーマットID
      //      00/01/02
      //  00-07(8)型番号
      //
      /**
        * RGB24フォーマットで、全ての画素が0
        */
      NULL_ALLZERO : 0x00000001,
      /**
        * USER - USER+0xFFFFはユーザー定義型。実験用に。
        */
      USER_DEFINE  : T_USER,

      /**
        * byte[]で、R8G8B8の24ビットで画素が格納されている。
        */
      BYTE1D_R8G8B8_24   : T_BYTE1D|0x0001,
      /**
        * byte[]で、B8G8R8の24ビットで画素が格納されている。
        */
      BYTE1D_B8G8R8_24   : T_BYTE1D|0x0002,
      /**
        * byte[]で、R8G8B8X8の32ビットで画素が格納されている。
        */
      BYTE1D_B8G8R8X8_32 : T_BYTE1D|0x0101,
      /**
        * byte[]で、X8R8G8B8の32ビットで画素が格納されている。
        */
      BYTE1D_X8R8G8B8_32 : T_BYTE1D|0x0102,

      /**
        * byte[]で、RGB565の16ビット(little/big endian)で画素が格納されている。
        */
      BYTE1D_R5G6B5_16LE : T_BYTE1D|0x0201,
      BYTE1D_R5G6B5_16BE : T_BYTE1D|0x0202,
      /**
        * short[]で、RGB565の16ビット(little/big endian)で画素が格納されている。
        */
      WORD1D_R5G6B5_16LE : T_SHORT1D|0x0201,
      WORD1D_R5G6B5_16BE : T_SHORT1D|0x0202,


      /**
        * int[][]で特に値範囲を定めない
        */
      INT2D        : T_INT2D|0x0000,
      /**
        * int[][]で0-255のグレイスケール画像
        */
      INT2D_GRAY_8 : T_INT2D|0x0001,
      /**
        * int[][]で0/1の2値画像
        * これは、階調値1bitのBUFFERFORMAT_INT2D_GRAY_1と同じです。
        */
      INT2D_BIN_8  : T_INT2D|0x0002,

      /**
        * int[]で特に値範囲を定めない
        */
      INT1D        : T_INT1D|0x0000,
      /**
        * int[]で0-255のグレイスケール画像
        */
      INT1D_GRAY_8 : T_INT1D|0x0001,
      /**
        * int[]で0/1の2値画像
        * これは、階調1bitのINT1D_GRAY_1と同じです。
        */
      INT1D_BIN_8  : T_INT1D|0x0002,


      /**
        * int[]で、XRGB32の32ビットで画素が格納されている。
        */
      INT1D_X8R8G8B8_32:T_INT1D|0x0102,

      /**
        * H(0-359),S(0-255),V(0-255)
        */
      INT1D_X7H9S8V8_32:T_INT1D|0x0103,


      /**
        * プラットフォーム固有オブジェクト
        */
      OBJECT_Java: T_OBJECT|0x0100,
      OBJECT_CS  : T_OBJECT|0x0200,
      OBJECT_AS3 : T_OBJECT|0x0300,
      OBJECT_JS : T_OBJECT|0x0400,

      /**
        * JavaのBufferedImageを格納するラスタ
        */
      OBJECT_Java_BufferedImage: T_OBJECT|0x0100|0x01,

      OBJECT_AS3_BitmapData : T_OBJECT|0x0300|0x01,
      /**
        * JavaScriptのCanvasを格納するラスタ
        */
      OBJECT_JS_Canvas : T_OBJECT|0x0400|0x01
    });
  })()
)





NyARDoublePoint2d = Klass(
{
  x : 0,
  y : 0,
  /**
    * 配列ファクトリ
    * @param i_number
    * @return
    */
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARDoublePoint2d();
    }
    return ret;
  }
  ,initialize : function()
  {
    switch(arguments.length) {
    case 0:
      {//public function NyARDoublePoint2d()
        this.x = 0;
        this.y = 0;
      }
      return;
    case 1:
      this.x=args[0].x;
      this.y=args[0].y;
      return;
      break;
    case 2:
      {	//public function NyARDoublePoint2d(i_x,i_y)
        this.x = Number(args[0]);
        this.y = Number(args[1]);
        return;
      }
    default:
      break;
    }
    throw new NyARException();
  }
  ,setValue_NyARDoublePoint2d : function(i_src)
  {
    this.x=i_src.x;
    this.y=i_src.y;
    return;
  }
  ,setValue_NyARIntPoint2d : function(i_src)
  {
    this.x=(i_src.x);
    this.y=(i_src.y);
    return;
  }
  /**
    * 格納値をベクトルとして、距離を返します。
    * @return
    */
  ,dist : function()
  {
    return Math.sqrt(this.x*this.x+this.y+this.y);
  }
  ,sqNorm : function()
  {
    return this.x*this.x+this.y+this.y;
  }
})





NyARDoublePoint3d = Klass(
{
  x : 0,
  y : 0,
  z : 0,
  /**
    * 配列ファクトリ
    * @param i_number
    * @return
    */
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARDoublePoint3d();
    }
    return ret;
  }
  ,setValue : function(i_in)
  {
    this.x=i_in.x;
    this.y=i_in.y;
    this.z=i_in.z;
    return;
  }
  /**
    * i_pointとのベクトルから距離を計算します。
    * @return
    */
  ,dist : function(i_point)
  {
    var x,y,z;
    x=this.x-i_point.x;
    y=this.y-i_point.y;
    z=this.z-i_point.z;
    return Math.sqrt(x*x+y*y+z*z);
  }
})




/**
  * ヒストグラムを格納するクラスです。
  */
NyARHistogram = Klass(
{
  /**
    * サンプリング値の格納変数
    */
  data : null,
  /**
    * 有効なサンプリング値の範囲。[0-data.length-1]
    */
  length : 0,
  /**
    * 有効なサンプルの総数 data[i]
    */
  total_of_data : 0,



  initialize : function(i_length)
  {
    this.data=new FloatVector(i_length);
    this.length=i_length;
    this.total_of_data=0;
  }
  /**
    * 区間i_stからi_edまでの総データ数を返します。
    * @param i_st
    * @param i_ed
    * @return
    */
  ,getTotal : function(i_st,i_ed)
  {
    NyAS3Utils.assert(i_st<i_ed && i_ed<this.length);
    var result=0;
    var s=this.data;
    for(var i=i_st;i<=i_ed;i++){
      result+=s[i];
    }
    return result;
  }
  /**
    * 指定したi_pos未満サンプルを０にします。
    * @param i_pos
    */
  ,lowCut : function(i_pos)
  {
    var s= 0;
    for(var i=0;i<i_pos;i++){
      s+=this.data[i];
      this.data[i]=0;
    }
    this.total_of_data-=s;
  }
  /**
    * 指定したi_pos以上のサンプルを０にします。
    * @param i_pos
    */
  ,highCut : function(i_pos)
  {
    var s=0;
    for(var i=this.length-1;i>=i_pos;i--){
      s+=this.data[i];
      this.data[i]=0;
    }
    this.total_of_data-=s;
  }
  /**
    * 最小の値が格納されているサンプル番号を返します。
    */
  ,getMinSample : function()
  {
    var data=this.data;
    var ret=this.length-1;
    var min=data[ret];
    for(var i=this.length-2;i>=0;i--)
    {
      if(data[i]<min){
        min=data[i];
        ret=i;
      }
    }
    return ret;
  }
  /**
    * サンプルの中で最小の値を返します。
    * @return
    */
  ,getMinData : function()
  {
    return this.data[this.getMinSample()];
  }
  /**
    * 平均値を計算します。
    * @return
    */
  ,getAverage : function()
  {
    var sum=0;
    for(var i=this.length-1;i>=0;i--)
    {
      sum+=this.data[i]*i;
    }
    return toInt(sum/this.total_of_data);
  }

})





NyARIntPoint2d = Klass(
{
  x : 0,

  y : 0,
  /**
    * 配列ファクトリ
    * @param i_number
    * @return
    */
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARIntPoint2d();
    }
    return ret;
  }
  ,copyArray : function(i_from,i_to)
  {
    for(var i=i_from.length-1;i>=0;i--)
    {
      i_to[i].x=i_from[i].x;
      i_to[i].y=i_from[i].y;
    }
    return;
  }
})





NyARIntRect = Klass(
{
  x : 0,

  y : 0,

  w : 0,

  h : 0
})





NyARIntSize = Klass(
{
  h : 0,
  w : 0,
  /*	public function NyARIntSize()
    * 	public function NyARIntSize(i_width,i_height)
    *	public function NyARIntSize(i_ref_object)
  */
  initialize : function()
  {
    switch(arguments.length) {
    case 0:
      {//public function NyARIntSize()
        this.w = 0;
        this.h = 0;
        return;
      }
    case 1:
      this.w = arguments[0].w;
      this.h = arguments[0].h;
      return;
      break;
    case 2:
      {	//public function NyARIntSize(i_ref_object)
        this.w=toInt(arguments[0]);
        this.h=toInt(arguments[1]);
        return;
      }
      break;
    default:
      break;
    }
    throw new NyARException();
  }

  /**
    * サイズが同一であるかを確認する。
    *
    * @param i_width
    * @param i_height
    * @return
    * @throws NyARException
    */
  ,isEqualSize_int : function(i_width,i_height)
  {
    if (i_width == this.w && i_height == this.h) {
      return true;
    }
    return false;
  }

  /**
    * サイズが同一であるかを確認する。
    *
    * @param i_width
    * @param i_height
    * @return
    * @throws NyARException
    */
  ,isEqualSize_NyARIntSize : function(i_size)
  {
    if (i_size.w == this.w && i_size.h == this.h) {
      return true;
    }
    return false;

  }
})




/**
  * 0=dx*x+dy*y+cのパラメータを格納します。
  * x,yの増加方向は、x=L→R,y=B→Tです。
  *
  */
NyARLinear = Klass(
{
  dx : 0,//dx軸の増加量
  dy : 0,//dy軸の増加量
  c : 0,//切片
  createArray : function(i_number)
  {
    var ret=new Array(i_number);
    for(var i=0;i<i_number;i++)
    {
      ret[i]=new NyARLinear();
    }
    return ret;
  }
  ,copyFrom : function(i_source)
  {
    this.dx=i_source.dx;
    this.dy=i_source.dy;
    this.c=i_source.c;
    return;
  }
  /**
    * 2直線の交点を計算します。
    * @param l_line_i
    * @param l_line_2
    * @param o_point
    * @return
    */
  ,crossPos : function(l_line_i,l_line_2 ,o_point)
  {
    var w1 = l_line_2.dy * l_line_i.dx - l_line_i.dy * l_line_2.dx;
    if (w1 == 0.0) {
      return false;
    }
    o_point.x = (l_line_2.dx * l_line_i.c - l_line_i.dx * l_line_2.c) / w1;
    o_point.y = (l_line_i.dy * l_line_2.c - l_line_2.dy * l_line_i.c) / w1;
    return true;
  }
})

