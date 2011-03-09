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


NyARMatchPattDeviationBlackWhiteData = ASKlass('NyARMatchPattDeviationBlackWhiteData',
{
  _data : null,
  _pow : 0,
  //
  _number_of_pixels : 0,
  refData : function()
  {
    return this._data;
  }
  ,getPow : function()
  {
    return this._pow;
  }
  ,NyARMatchPattDeviationBlackWhiteData : function(i_width,i_height)
  {
    this._number_of_pixels=i_height*i_width;
    this._data=new IntVector(this._number_of_pixels);
    return;
  }
  /**
   * XRGB[width*height]の配列から、パターンデータを構築。
   * @param i_buffer
   */
  ,setRaster : function(i_raster)
  {
    //i_buffer[XRGB]→差分[BW]変換
    var i;
    var ave;//<PV/>
    var rgb;//<PV/>
    var linput=this._data;//<PV/>
    var buf=(i_raster.getBuffer());
    // input配列のサイズとwhも更新// input=new int[height][width][3];
    var number_of_pixels=this._number_of_pixels;
    //<平均値計算(FORの1/8展開)/>
    ave = 0;
    for(i=number_of_pixels-1;i>=0;i--){
      rgb = buf[i];
      ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);
    }
    ave=(number_of_pixels*255*3-ave)/(3*number_of_pixels);
    //
    var sum = 0,w_sum;
    //<差分値計算/>
    for (i = number_of_pixels-1; i >= 0;i--) {
      rgb = buf[i];
      w_sum =((255*3-(rgb & 0xff)-((rgb >> 8) & 0xff)-((rgb >> 16) & 0xff))/3)-ave;
      linput[i] = w_sum;
      sum += w_sum * w_sum;
    }
    var p=Math.sqrt(sum);
    this._pow=p!=0.0?p:0.0000001;
    return;
  }
})
NyARMatchPattDeviationColorData = ASKlass('NyARMatchPattDeviationColorData',
{
  _data : null,
  _pow : 0,
  //
  _number_of_pixels : 0,
  _optimize_for_mod : 0,
  refData : function()
  {
    return this._data;
  }
  ,getPow : function()
  {
    return this._pow;
  }
  ,NyARMatchPattDeviationColorData : function(i_width,i_height)
  {
    this._number_of_pixels=i_height*i_width;
    this._data=new IntVector(this._number_of_pixels*3);
    this._optimize_for_mod=this._number_of_pixels-(this._number_of_pixels%8);
    return;
  }
  /**
   * NyARRasterからパターンデータをセットします。
   * この関数は、データを元に所有するデータ領域を更新します。
   * @param i_buffer
   */
  ,setRaster : function(i_raster)
  {
    //画素フォーマット、サイズ制限
    NyAS3Utils.assert(i_raster.isEqualBufferType(NyARBufferType.INT1D_X8R8G8B8_32));
    NyAS3Utils.assert(i_raster.getSize().isEqualSize_NyARIntSize(i_raster.getSize()));
    var buf=(i_raster.getBuffer());
    //i_buffer[XRGB]→差分[R,G,B]変換
    var i;
    var ave;//<PV/>
    var rgb;//<PV/>
    var linput=this._data;//<PV/>
    // input配列のサイズとwhも更新// input=new int[height][width][3];
    var number_of_pixels=this._number_of_pixels;
    var for_mod=this._optimize_for_mod;
    //<平均値計算(FORの1/8展開)>
    ave = 0;
    for(i=number_of_pixels-1;i>=for_mod;i--){
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);
    }
    for (;i>=0;) {
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
      rgb = buf[i];ave += ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);i--;
    }
    //<平均値計算(FORの1/8展開)/>
    ave=number_of_pixels*255*3-ave;
    ave =255-(ave/ (number_of_pixels * 3));//(255-R)-ave を分解するための事前計算
    var sum = 0,w_sum;
    var input_ptr=number_of_pixels*3-1;
    //<差分値計算(FORの1/8展開)>
    for (i = number_of_pixels-1; i >= for_mod;i--) {
      rgb = buf[i];
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
    }
    for (; i >=0;) {
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
      rgb = buf[i];i--;
      w_sum = (ave - (rgb & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//B
      w_sum = (ave - ((rgb >> 8) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//G
      w_sum = (ave - ((rgb >> 16) & 0xff)) ;linput[input_ptr--] = w_sum;sum += w_sum * w_sum;//R
    }
    //<差分値計算(FORの1/8展開)/>
    var p=Math.sqrt(sum);
    this._pow=p!=0.0?p:0.0000001;
    return;
  }
})
NyARMatchPattResult = ASKlass('NyARMatchPattResult',
{
  DIRECTION_UNKNOWN : -1,
  confidence : 0,
  direction : 0
})



/**
 * ARToolKitのマーカーコードを1個保持します。
 *
 */
NyARCode = ASKlass('NyARCode',
{
  _color_pat : new Array(4),
  _bw_pat : new Array(4),
  _width : 0,
  _height : 0,
  NyARCode : function(i_width, i_height)
  {
    this._width = i_width;
    this._height = i_height;
    //空のラスタを4個作成
    for(var i=0;i<4;i++){
      this._color_pat[i]=new NyARMatchPattDeviationColorData(i_width,i_height);
      this._bw_pat[i]=new NyARMatchPattDeviationBlackWhiteData(i_width,i_height);
    }
    return;
  }
  ,getColorData : function(i_index)
  {
    return this._color_pat[i_index];
  }
  ,getBlackWhiteData : function(i_index)
  {
    return this._bw_pat[i_index];
  }
  ,getWidth : function()
  {
    return this._width;
  }
  ,getHeight : function()
  {
    return this._height;
  }
  ,loadARPattFromFile : function(i_stream)
  {
    NyARCodeFileReader.loadFromARToolKitFormFile(i_stream,this);
    return;
  }
  ,setRaster : function(i_raster)
  {
    NyAS3Utils.assert(i_raster.length!=4);
    //ラスタにパターンをロードする。
    for(var i=0;i<4;i++){
      this._color_pat[i].setRaster(i_raster[i]);
    }
    return;
  }
})






NyARCodeFileReader = ASKlass('NyARCodeFileReader',
{

  /**
  * ARコードファイルからデータを読み込んでo_codeに格納します。
  * @param i_stream
  * @param o_code
  * @throws NyARException
  */
  loadFromARToolKitFormFile : function(i_stream,o_code)
  {
    var width=o_code.getWidth();
    var height=o_code.getHeight();
    var tmp_raster=new NyARRaster(width,height,NyARBufferType.INT1D_X8R8G8B8_32);
    //4個の要素をラスタにセットする。
    var token = i_stream.match(/\d+/g);
    var buf=(tmp_raster.getBuffer());
    //GBRAで一度読みだす。
    for (var h = 0; h < 4; h++){
      this.readBlock(token,width,height,buf);
      //ARCodeにセット(カラー)
      o_code.getColorData(h).setRaster(tmp_raster);
      o_code.getBlackWhiteData(h).setRaster(tmp_raster);
    }
    tmp_raster=null;//ポイ
    return;
  }
  /**
  * 1ブロック分のXRGBデータをi_stからo_bufへ読みだします。
  * @param i_st
  * @param o_buf
  */
  ,readBlock : function(i_st, i_width, i_height, o_buf)
  {
    var pixels = i_width * i_height;
    var i3;
    for (i3 = 0; i3 < 3; i3++) {
      for (var i2 = 0; i2 < pixels; i2++){
        // 数値のみ読み出す
        var val = parseInt(i_st.shift());
        if(isNaN(val)){
          throw new NyARException("syntax error in pattern file.");
        }
        o_buf[i2]=(o_buf[i2]<<8)|((0x000000ff&toInt(val)));
      }
    }
    //GBR→RGB
    for(i3=0;i3<pixels;i3++){
      o_buf[i3]=((o_buf[i3]<<16)&0xff0000)|(o_buf[i3]&0x00ff00)|((o_buf[i3]>>16)&0x0000ff);
    }
    return;
  }
})
