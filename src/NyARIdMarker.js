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
NyIdMarkerParam = ASKlass('NyIdMarkerParam',
{
  /**
   * マーカの方位値です。
   */
  direction : 0,
  /**
   * マーカ周辺のパターン閾値です。
   */
  threshold : 0
})
NyIdMarkerPattern = ASKlass('NyIdMarkerPattern',
{
  model : 0,
  ctrl_domain : 0,
  ctrl_mask : 0,
  check : 0,
  data : new IntVector(32)
})




TThreshold = ASKlass('TThreshold',
{
  th_h : 0,
  th_l : 0,
  th : 0,
  lt_x : 0,
  lt_y : 0,
  rb_x : 0,
  rb_y : 0
})
THighAndLow = ASKlass('THighAndLow',
{
  h : 0,
  l : 0
})
/**
 * Marker pattern encoder。
 *
 */
_bit_table_3 = new IntVector([
  25,  26,  27,  28,  29,  30,  31,
  48,  9,  10,  11,  12,  13,  32,
  47,  24,  1,  2,  3,  14,  33,
  46,  23,  8,  0,  4,  15,  34,
  45,  22,  7,  6,  5,  16,  35,
  44,  21,  20,  19,  18,  17,  36,
  43,  42,  41,  40,  39,  38,  37
  ])
_bit_table_2 = new IntVector([
  9,  10,  11,  12,  13,
  24,  1,  2,  3,  14,
  23,  8,  0,  4,  15,
  22,  7,  6,  5,  16,
  21,  20,  19,  18,  17])
MarkerPattEncoder = ASKlass('MarkerPattEncoder',
{
  _bit_table_2 : _bit_table_2,
  _bit_table_3 : _bit_table_3,
  _bit_tables : [
    _bit_table_2,_bit_table_3,null,null,null,null,null],
  /**
  * RECT(0):[0]=(0)
  * RECT(1):[1]=(1-8)
  * RECT(2):[2]=(9-16),[3]=(17-24)
  * RECT(3):[4]=(25-32),[5]=(33-40),[6]=(41-48)
  */
  _bit_table : null,
  _bits : new IntVector(16),
  _work : new IntVector(16),
  _model : 0,
  setBitByBitIndex : function(i_index_no,i_value)
  {
    NyAS3Utils.assert(i_value==0 || i_value==1);
    var bit_no=this._bit_table[i_index_no];
    if(bit_no==0){
      this._bits[0]=i_value;
    }else{
      var bidx=toInt((bit_no-1)/8)+1;
      var sidx=(bit_no-1)%8;
      this._bits[bidx]=(this._bits[bidx]&(~(0x01<<sidx)))|(i_value<<sidx);
    }
    return;
  }
  ,setBit : function(i_bit_no,i_value)
  {
    NyAS3Utils.assert(i_value==0 || i_value==1);
    if(i_bit_no==0){
      this._bits[0]=i_value;
    }else{
      var bidx=toInt((i_bit_no-1)/8)+1;
      var sidx=(i_bit_no-1)%8;
      this._bits[bidx]=(this._bits[bidx]&(~(0x01<<sidx)))|(i_value<<sidx);
    }
    return;
  }
  ,getBit : function(i_bit_no)
  {
    if(i_bit_no==0){
      return this._bits[0];
    }else{
      var bidx=toInt((i_bit_no-1)/8)+1;
      var sidx=(i_bit_no-1)%8;
      return (this._bits[bidx]>>(sidx))&(0x01);
    }
  }
  ,getModel : function()
  {
    return this._model;
  }
  ,getControlValue : function(i_model,i_data)
  {
    var v;
    switch(i_model){
    case 2:
      v=(i_data[2] & 0x0e)>>1;
      return v>=5?v-1:v;
    case 3:
      v=(i_data[4] & 0x3e)>>1;
      return v>=21?v-1:v;
    case 4:
    case 5:
    case 6:
        case 7:
        default:
            break;
    }
    return -1;
  }
  ,getCheckValue : function(i_model,i_data)
  {
    var v;
    switch(i_model){
    case 2:
      v=(i_data[2] & 0xe0)>>5;
      return v>5?v-1:v;
    case 3:
      v=((i_data[4] & 0x80)>>7) |((i_data[5] & 0x0f)<<1);
      return v>21?v-1:v;
    case 4:
    case 5:
    case 6:
        case 7:
        default:
            break;
    }
    return -1;
  }
  ,initEncoder : function(i_model)
  {
    if(i_model>3 || i_model<2){
      //Lv4以降に対応する時は、この制限を変える。
      // Change this when Lv4 is supported.
      return false;
    }
    this._bit_table=this._bit_tables[i_model-2];
    this._model=i_model;
    return true;
  }
  ,getDirection : function()
  {
    var l,t,r,b;
    var timing_pat;
    switch(this._model){
    case 2:
      //トラッキングセルを得る
      // get tracking cel
      t=this._bits[2] & 0x1f;
      r=((this._bits[2] & 0xf0)>>4)|((this._bits[3]&0x01)<<4);
      b=this._bits[3] & 0x1f;
      l=((this._bits[3] & 0xf0)>>4)|((this._bits[2]&0x01)<<4);
      timing_pat=0x0a;
      break;
    case 3:
      t=this._bits[4] & 0x7f;
      r=((this._bits[4] & 0xc0)>>6)|((this._bits[5] & 0x1f)<<2);
      b=((this._bits[5] & 0xf0)>>4)|((this._bits[6] & 0x07)<<4);
      l=((this._bits[6] & 0xfc)>>2)|((this._bits[4] & 0x01)<<6);
      timing_pat=0x2a;
      break;
    default:
      return -3;
    }
    //タイミングパターンの比較
    // timing pattern comparison
    if(t==timing_pat){
      if(r==timing_pat){
        return (b!=timing_pat && l!=timing_pat)?2:-2;
      }else if(l==timing_pat){
        return (b!=timing_pat && r!=timing_pat)?3:-2;
      }
    }else if(b==timing_pat){
      if(r==timing_pat){
        return (t!=timing_pat && l!=timing_pat)?1:-2;
      }else if(l==timing_pat){
        return (t!=timing_pat && r!=timing_pat)?0:-2;
      }
    }
    return -1;
  }
  /**
  * 格納しているマーカパターンをエンコードして、マーカデータを返します。
  * Encodes the stored marker pattern, writes marker data to o_out.
  * @param o_out
  * @return
  * 成功すればマーカの方位を返却します。失敗すると-1を返します。
  * On success, returns the marker direction. On failure, returns -1.
  */
  ,encode : function(o_out)
  {
    var d=this.getDirection();
    if(d<0){
      return -1;
    }
    //回転ビットの取得
    // Acquire the rotation bit
    this.getRotatedBits(d,o_out.data);
    var model=this._model;
    //周辺ビットの取得
    // Acquire border bits
    o_out.model=model;
    var control_bits=this.getControlValue(model,o_out.data);
    o_out.check=this.getCheckValue(model,o_out.data);
    o_out.ctrl_mask=control_bits%5;
    o_out.ctrl_domain=toInt(control_bits/5);
    if(o_out.ctrl_domain!=0 || o_out.ctrl_mask!=0){
      // failed to find a proper mask and domain, return -1
      return -1;//ドメイン、マスクは現在0のみなので、それ以外の場合-1（失敗）を返す
    }
    //マスク解除処理を実装すること
    // implement mask release
    return d;
  }
  ,getRotatedBits : function(i_direction,o_out)
  {
    var sl=i_direction*2;
    var sr=8-sl;
    var w1;
    o_out[0]=this._bits[0];
    //RECT1
    w1=this._bits[1];
    o_out[1]=((w1<<sl)|(w1>>sr))& 0xff;
    //RECT2
    sl=i_direction*4;
    sr=16-sl;
    w1=this._bits[2]|(this._bits[3]<<8);
    w1=(w1<<sl)|(w1>>sr);
    o_out[2]=w1 & 0xff;
    o_out[3]=(w1>>8) & 0xff;
    if(this._model<2){
      return;
    }
    //RECT3
    sl=i_direction*6;
    sr=24-sl;
    w1=this._bits[4]|(this._bits[5]<<8)|(this._bits[6]<<16);
    w1=(w1<<sl)|(w1>>sr);
    o_out[4]=w1 & 0xff;
    o_out[5]=(w1>>8) & 0xff;
    o_out[6]=(w1>>16) & 0xff;
    if(this._model<3){
      return;
    }
    //RECT4(Lv4以降はここの制限を変える) uncomment when Lv4 supported
  //    shiftLeft(this._bits,7,3,i_direction*8);
  //    if(this._model<4){
  //      return;
  //    }
    return;
  }
  ,shiftLeft : function(i_pack,i_start,i_length,i_ls)
  {
    var i;
    var work=this._work;
    //端数シフト
    var mod_shift=i_ls%8;
    for(i=i_length-1;i>=1;i--){
      work[i]=(i_pack[i+i_start]<<mod_shift)|(0xff&(i_pack[i+i_start-1]>>(8-mod_shift)));
    }
    work[0]=(i_pack[i_start]<<mod_shift)|(0xff&(i_pack[i_start+i_length-1]>>(8-mod_shift)));
    //バイトシフト
    var byte_shift=toInt(i_ls/8)%i_length;
    for(i=i_length-1;i>=0;i--){
      i_pack[(byte_shift+i)%i_length+i_start]=0xff & work[i];
    }
    return;
  }
})
INyIdMarkerData = ASKlass('INyIdMarkerData',
{
  /**
   * i_targetのマーカデータと自身のデータが等しいかを返します。
   * @param i_target
   * 比較するマーカオブジェクト
   * @return
   * 等しいかの真偽値
   */
  isEqual : function(i_target){},
  /**
   * i_sourceからマーカデータをコピーします。
   * @param i_source
   */
  copyFrom : function(i_source){}
})


/**
 * ラスタ画像の任意矩形から、NyARIdMarkerDataを抽出します。
 *
 */
NyIdMarkerPickup = ASKlass('NyIdMarkerPickup',
{
  _perspective_reader : null,
  __pickFromRaster_th : new TThreshold(),
  __pickFromRaster_encoder : new MarkerPattEncoder(),
  NyIdMarkerPickup : function()
  {
    this._perspective_reader=new PerspectivePixelReader();
    return;
  }
  /**
   * Initialize the marker pickup for a new frame.
   * Clears out old values from perspective reader motion cache.
   */
  ,init : function()
  {
    this._perspective_reader.newFrame();
  }
  /**
   * i_imageから、idマーカを読みだします。
   * o_dataにはマーカデータ、o_paramにはまーかのパラメータを返却します。
   * @param image
   * @param i_square
   * @param o_data
   * @param o_param
   * @return
   * @throws NyARException
   */
  ,pickFromRaster : function(image,i_vertex,o_data,o_param)
  {
    //遠近法のパラメータを計算
    if(!this._perspective_reader.setSourceSquare(i_vertex)){
      if (window.DEBUG)
        console.log('NyIdMarkerPickup.pickFromRaster: could not setSourceSquare')
      return false;
    };
    var reader=image.getGrayPixelReader();
    var raster_size=image.getSize();
    var th=this.__pickFromRaster_th;
    var encoder=this.__pickFromRaster_encoder;
    //マーカパラメータを取得
    this._perspective_reader.detectThresholdValue(reader,raster_size,th);
    if(!this._perspective_reader.readDataBits(reader,raster_size,th, encoder)){
      if (window.DEBUG)
        console.log('NyIdMarkerPickup.pickFromRaster: could not readDataBits')
      return false;
    }
    var d=encoder.encode(o_data);
    if(d<0){
      if (window.DEBUG)
        console.log('NyIdMarkerPickup.pickFromRaster: could not encode')
      return false;
    }
    o_param.direction=d;
    o_param.threshold=th.th;
    return true;
  }
})






/**
 * NyARColorPatt_NyIdMarkerがラスタからPerspective変換して読みだすためのクラス
 *
 */
PerspectivePixelReader = ASKlass('PerspectivePixelReader',
{
  _param_gen : new NyARPerspectiveParamGenerator_O1(1,1,100,100),
  _cparam : new FloatVector(8),
  PerspectivePixelReader : function()
  {
    return;
  }
  ,maxPreviousFrameAge : 1
  ,newFrame : function()
  {
    for (var i in this.previousFrames) {
      var pf = this.previousFrames[i];
      pf.age++;
      if (pf.age > this.maxPreviousFrameAge) {
        delete this.previousFrames[i];
      }
    }
  }
  ,setSourceSquare : function(i_vertex)
  {
    var cx = 0, cy = 0;
    for (var i=0; i<4; i++) {
      cx += i_vertex[i].x;
      cy += i_vertex[i].y;
    }
    cx /= 4;
    cy /= 4;
    var qx = toInt(cx / 10);
    var qy = toInt(cy / 10);
    this.centerPoint[0] = qx;
    this.centerPoint[1] = qy;
    return this._param_gen.getParam(i_vertex, this._cparam);
  }
  /**
  * 矩形からピクセルを切り出します
  * @param i_lt_x
  * @param i_lt_y
  * @param i_step_x
  * @param i_step_y
  * @param i_width
  * @param i_height
  * @param i_out_st
  * o_pixelへの格納場所の先頭インデクス
  * @param o_pixel
  * @throws NyARException
  */
  ,rectPixels : function(i_reader,i_raster_size,i_lt_x,i_lt_y,i_step_x,i_step_y,i_width,i_height,i_out_st,o_pixel)
  {
    var cpara=this._cparam;
    var ref_x=this._ref_x;
    var ref_y=this._ref_y;
    var pixcel_temp=this._pixcel_temp;
    var raster_width=i_raster_size.w;
    var raster_height=i_raster_size.h;
    var out_index=i_out_st;
    var cpara_6=cpara[6];
    var cpara_0=cpara[0];
    var cpara_3=cpara[3];
    for(var i=0;i<i_height;i++){
      //1列分のピクセルのインデックス値を計算する。
      var cy0=1+i*i_step_y+i_lt_y;
      var cpy0_12=cpara[1]*cy0+cpara[2];
      var cpy0_45=cpara[4]*cy0+cpara[5];
      var cpy0_7=cpara[7]*cy0+1.0;
      var pt = 0;
      var i2;
      for(i2=0;i2<i_width;i2++)
      {
        var cx0=1+i2*i_step_x+i_lt_x;
        var d=cpara_6*cx0+cpy0_7;
        var x=toInt((cpara_0*cx0+cpy0_12)/d);
        var y=toInt((cpara_3*cx0+cpy0_45)/d);
        if(x<0||y<0||x>=raster_width||y>=raster_height)
        {
          return false;
        }
        ref_x[pt]=x;
        ref_y[pt]=y;
        pt++;
      }
      //1行分のピクセルを取得(場合によっては専用アクセサを書いた方がいい)
      i_reader.getPixelSet(ref_x,ref_y,i_width,pixcel_temp);
      //グレースケールにしながら、line→mapへの転写
      for(i2=0;i2<i_width;i2++){
        var index=i2;
        o_pixel[out_index]=pixcel_temp[index];
        out_index++;
      }
    }
    return true;
  }
  /**
  * i_freqにあるゼロクロス点の周期が、等間隔か調べます。
  * 次段半周期が、前段の80%より大きく、120%未満であるものを、等間隔周期であるとみなします。
  * @param i_freq
  * @param i_width
  */
  ,checkFreqWidth : function(i_freq,i_width)
  {
    var c=i_freq[1]-i_freq[0];
    var count=i_width*2-1;
    for (var i= 1; i < count; i++) {
      var n=i_freq[i+1]-i_freq[i];
      var v=n*100/c;
      if(v>150 || v<50){
        return false;
      }
      c=n;
    }
    return true;
  }
  /**
  * i_freq_count_tableとi_freq_tableの内容を調査し、最も大きな周波数成分を返します。
  * @param i_freq_count_table
  * @param i_freq_table
  * @param o_freq_table
  * @return
  * 見つかれば0以上、密辛ければ0未満
  */
  ,getMaxFreq : function(i_freq_count_table,i_freq_table,o_freq_table)
  {
    //一番成分の大きいものを得る
    var index=-1;
    var max = 0;
    var i;
    for(i=0;i<this.MAX_FREQ;i++){
      if(max<i_freq_count_table[i]){
        index=i;
        max=i_freq_count_table[i];
      }
    }
    if(index==-1){
      return -1;
    }
    /*周波数インデクスを計算*/
    var st=(index-1)*index;
    for(i=0;i<index*2;i++)
    {
      o_freq_table[i]=i_freq_table[st+i]*this.FRQ_STEP/max;
    }
    return index;
  },
  //タイミングパターン用のパラメタ(this.FRQ_POINTS*this.FRQ_STEPが100を超えないようにすること)
  FRQ_EDGE : 10,
  FRQ_STEP : 2,
  FRQ_POINTS : (100-(5/*FRQ_EDGE*/*2))/2/*FRQ_STEP*/,
  MIN_FREQ : 3,
  MAX_FREQ : 10,
  FREQ_SAMPLE_NUM : 4,
  MAX_DATA_BITS : 10+10/*MAX_FREQ+MAX_FREQ*/-1,
  _ref_x : new IntVector(108),
  _ref_y : new IntVector(108),
  //(model+1)*4*3とthis.THRESHOLD_PIXEL*3のどちらか大きい方
  _pixcel_temp : new IntVector(108),
  _freq_count_table : new IntVector(10/*MAX_FREQ*/),
  _freq_table : new IntVector((10/*MAX_FREQ*/*2-1)*10/*MAX_FREQ*/*2/2),
  /**
  * i_y1行目とi_y2行目を平均して、タイミングパターンの周波数を得ます。
  * LHLを1周期として、たとえばLHLHLの場合は2を返します。LHLHやHLHL等の始端と終端のレベルが異なるパターンを
  * 検出した場合、関数は失敗します。
  *
  * @param i_y1
  * @param i_y2
  * @param i_th_h
  * @param i_th_l
  * @param o_edge_index
  * 検出したエッジ位置(H->L,L->H)のインデクスを受け取る配列です。
  * [this.FRQ_POINTS]以上の配列を指定してください。
  * @return
  * @throws NyARException
  */
  getRowFrequency : function(i_reader,i_raster_size,i_y1,i_th_h,i_th_l,o_edge_index)
  {
    var i;
    //3,4,5,6,7,8,9,10
    var freq_count_table=this._freq_count_table;
    //0,2,4,6,8,10,12,14,16,18,20の要素を持つ配列
    var freq_table=this._freq_table;
    //初期化
    var cpara=this._cparam;
    var ref_x=this._ref_x;
    var ref_y=this._ref_y;
    var pixcel_temp=this._pixcel_temp;
    for(i=0;i<10;i++){
      freq_count_table[i]=0;
    }
    for(i=0;i<110;i++){
      freq_table[i]=0;
    }
    var raster_width=i_raster_size.w;
    var raster_height=i_raster_size.h;
    var cpara_0=cpara[0];
    var cpara_3=cpara[3];
    var cpara_6=cpara[6];
    var cv;
    if (window.DEBUG) {
      cv = document.getElementById('debugCanvas').getContext('2d');
      cv.fillStyle = 'orange';
    }
    //10-20ピクセル目からタイミングパターンを検出
    for (i = 0; i < this.FREQ_SAMPLE_NUM; i++) {
      var i2;
      //2行分のピクセルインデックスを計算
      var cy0=1+i_y1+i/**this.FRQ_STEP*5+this.FRQ_EDGE*/;
      var cpy0_12=cpara[1]*cy0+cpara[2];
      var cpy0_45=cpara[4]*cy0+cpara[5];
      var cpy0_7=cpara[7]*cy0+1.0;
      var pt=0;
      for(i2=0;i2<this.FRQ_POINTS;i2++)
      {
        var cx0=1+i2*this.FRQ_STEP+this.FRQ_EDGE;
        var d=(cpara_6*cx0)+cpy0_7;
        var x=toInt((cpara_0*cx0+cpy0_12)/d);
        var y=toInt((cpara_3*cx0+cpy0_45)/d);
        if(x<0||y<0||x>=raster_width||y>=raster_height)
        {
          return -1;
        }
        ref_x[pt]=x;
        ref_y[pt]=y;
        pt++;
      }
      //ピクセルを取得(入力画像を多様化するならここから先を調整すること)
      i_reader.getPixelSet(ref_x,ref_y,this.FRQ_POINTS,pixcel_temp);
      if (window.DEBUG) {
        for (var j=0; j<this.FRQ_POINTS; j++) {
          cv.fillRect(ref_x[j], ref_y[j], 1,1);
        }
      }
      //o_edge_indexを一時的に破壊して調査する
      var freq_t=this.getFreqInfo(pixcel_temp,i_th_h,i_th_l,o_edge_index);
      //周期は3-10であること
      if(freq_t<this.MIN_FREQ || freq_t>this.MAX_FREQ){
        continue;
      }
      //周期は等間隔であること
      if(!this.checkFreqWidth(o_edge_index,freq_t)){
        continue;
      }
      //検出カウンタを追加
      freq_count_table[freq_t]++;
      var table_st=(freq_t-1)*freq_t;
      for(i2=0;i2<freq_t*2;i2++){
        freq_table[table_st+i2]+=o_edge_index[i2];
      }
    }
    return this.getMaxFreq(freq_count_table,freq_table,o_edge_index);
  }
  ,getColFrequency : function(i_reader,i_raster_size,i_x1,i_th_h,i_th_l,o_edge_index)
  {
    var i;
    var cpara=this._cparam;
    var ref_x=this._ref_x;
    var ref_y=this._ref_y;
    var pixcel_temp=this._pixcel_temp;
    //0,2,4,6,8,10,12,14,16,18,20=(11*20)/2=110
    //初期化
    var freq_count_table=this._freq_count_table;
    for(i=0;i<10;i++){
      freq_count_table[i]=0;
    }
    var freq_table = this._freq_table;
    for(i=0;i<110;i++){
      freq_table[i]=0;
    }
    var raster_width=i_raster_size.w;
    var raster_height=i_raster_size.h;
    var cpara7=cpara[7];
    var cpara4=cpara[4];
    var cpara1=cpara[1];
    var cv;
    if (window.DEBUG) {
      cv = document.getElementById('debugCanvas').getContext('2d');
      cv.fillStyle = 'green';
    }
    //基準点から4ピクセルを参照パターンとして抽出
    for (i = 0; i < this.FREQ_SAMPLE_NUM; i++) {
      var i2;
      var cx0=1+i/**this.FRQ_STEP*5+this.FRQ_EDGE*/+i_x1;
      var cp6_0=cpara[6]*cx0;
      var cpx0_0=cpara[0]*cx0+cpara[2];
      var cpx3_0=cpara[3]*cx0+cpara[5];
      var pt=0;
      for(i2=0;i2<this.FRQ_POINTS;i2++)
      {
        var cy=1+i2*this.FRQ_STEP+this.FRQ_EDGE;
        var d=cp6_0+cpara7*cy+1.0;
        var x=toInt((cpx0_0+cpara1*cy)/d);
        var y=toInt((cpx3_0+cpara4*cy)/d);
        if(x<0||y<0||x>=raster_width||y>=raster_height)
        {
          return -1;
        }
        ref_x[pt]=x;
        ref_y[pt]=y;
        pt++;
      }
      //ピクセルを取得(入力画像を多様化するならここを調整すること)
      i_reader.getPixelSet(ref_x,ref_y,this.FRQ_POINTS,pixcel_temp);
      if (window.DEBUG) {
        for (var j=0; j<this.FRQ_POINTS; j++) {
          cv.fillRect(ref_x[j], ref_y[j], 1,1);
        }
      }
      var freq_t=this.getFreqInfo(pixcel_temp,i_th_h,i_th_l,o_edge_index);
      //周期は3-10であること
      if(freq_t<this.MIN_FREQ || freq_t>this.MAX_FREQ){
        continue;
      }
      //周期は等間隔であること
      if(!this.checkFreqWidth(o_edge_index,freq_t)){
        continue;
      }
      //検出カウンタを追加
      freq_count_table[freq_t]++;
      var table_st=(freq_t-1)*freq_t;
      for(i2=0;i2<freq_t*2;i2++){
        freq_table[table_st+i2]+=o_edge_index[i2];
      }
    }
    return this.getMaxFreq(freq_count_table,freq_table,o_edge_index);
  }
  /**
  * デバックすんだらstaticにしておｋ
  * @param i_pixcels
  * @param i_th_h
  * @param i_th_l
  * @param o_edge_index
  * @return
  */
  ,getFreqInfo : function(i_pixcels,i_th_h,i_th_l,o_edge_index)
  {
    //トークンを解析して、周波数を計算
    var i=0;
    var frq_l2h=0;
    var frq_h2l = 0;
    var index,pix;
    while(i<this.FRQ_POINTS){
      //L->Hトークンを検出する
      while(i<this.FRQ_POINTS){
        index=i;
        pix=i_pixcels[index];
        if(pix>i_th_h){
          //トークン発見
          o_edge_index[frq_l2h+frq_h2l]=i;
          frq_l2h++;
          break;
        }
        i++;
      }
      i++;
      //L->Hトークンを検出する
      while(i<this.FRQ_POINTS){
        index=i;
        pix=i_pixcels[index];
        if(pix<=i_th_l){
          //トークン発見
          o_edge_index[frq_l2h+frq_h2l]=i;
          frq_h2l++;
          break;
        }
        i++;
      }
      i++;
    }
    return frq_l2h==frq_h2l?frq_l2h:-1;
  },
  THRESHOLD_EDGE : 10,
  THRESHOLD_STEP : 2,
  THRESHOLD_WIDTH : 10,
  THRESHOLD_PIXEL : 10/2/*this.THRESHOLD_WIDTH/this.THRESHOLD_STEP*/,
  THRESHOLD_SAMPLE : 5*5/*this.THRESHOLD_PIXEL*this.THRESHOLD_PIXEL*/,
  THRESHOLD_SAMPLE_LT : 10/*this.THRESHOLD_EDGE*/,
  THRESHOLD_SAMPLE_RB : 100-10-10/*this.THRESHOLD_WIDTH-this.THRESHOLD_EDGE*/,
  /**
  * ピクセル配列の上位、下位の4ピクセルのピクセル値平均を求めます。
  * この関数は、(4/i_pixcel.length)の領域を占有するPtail法で双方向の閾値を求めることになります。
  * @param i_pixcel
  * @param i_initial
  * @param i_out
  */
  getPtailHighAndLow : function(i_pixcel,i_out )
  {
    var h3,h2,h1,h0,l3,l2,l1,l0;
    h3=h2=h1=h0=l3=l2=l1=l0=i_pixcel[0];
    for(var i=i_pixcel.length-1;i>=1;i--){
      var pix=i_pixcel[i];
      if(h0<pix){
        if(h1<pix){
          if(h2<pix){
            if(h3<pix){
              h0=h1;
              h1=h2;
              h2=h3;
              h3=pix;
            }else{
              h0=h1;
              h1=h2;
              h2=pix;
            }
          }else{
            h0=h1;
            h1=pix;
          }
        }else{
          h0=pix;
        }
      }
      if(l0>pix){
        if(l1>pix){
          if(l2>pix){
            if(l3>pix){
              l0=l1;
              l1=l2;
              l2=l3;
              l3=pix;
            }else{
              l0=l1;
              l1=l2;
              l2=pix;
            }
          }else{
            l0=l1;
            l1=pix;
          }
        }else{
          l0=pix;
        }
      }
    }
    i_out.l=(l0+l1+l2+l3)/4;
    i_out.h=(h0+h1+h2+h3)/4;
    return;
  },
  __detectThresholdValue_hl : new THighAndLow(),
  __detectThresholdValue_tpt : new NyARIntPoint2d(),
  _th_pixels : new IntVector(5*5/*this.THRESHOLD_SAMPLE*/*4),
  /**
  * 指定した場所のピクセル値を調査して、閾値を計算して返します。
  * @param i_reader
  * @param i_x
  * @param i_y
  * @return
  * @throws NyARException
  */
  detectThresholdValue : function(i_reader,i_raster_size,o_threshold)
  {
    var th_pixels=this._th_pixels;
    //左上のピックアップ領域からピクセルを得る(00-24)
    this.rectPixels(i_reader,i_raster_size,this.THRESHOLD_SAMPLE_LT,this.THRESHOLD_SAMPLE_LT,this.THRESHOLD_STEP,this.THRESHOLD_STEP,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,0,th_pixels);
    //左下のピックアップ領域からピクセルを得る(25-49)
    this.rectPixels(i_reader,i_raster_size,this.THRESHOLD_SAMPLE_LT,this.THRESHOLD_SAMPLE_RB,this.THRESHOLD_STEP,this.THRESHOLD_STEP,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,this.THRESHOLD_SAMPLE,th_pixels);
    //右上のピックアップ領域からピクセルを得る(50-74)
    this.rectPixels(i_reader,i_raster_size,this.THRESHOLD_SAMPLE_RB,this.THRESHOLD_SAMPLE_LT,this.THRESHOLD_STEP,this.THRESHOLD_STEP,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,this.THRESHOLD_SAMPLE*2,th_pixels);
    //右下のピックアップ領域からピクセルを得る(75-99)
    this.rectPixels(i_reader,i_raster_size,this.THRESHOLD_SAMPLE_RB,this.THRESHOLD_SAMPLE_RB,this.THRESHOLD_STEP,this.THRESHOLD_STEP,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,this.THRESHOLD_SAMPLE*3,th_pixels);
    var hl=this.__detectThresholdValue_hl;
    //Ptailで求めたピクセル平均
    this.getPtailHighAndLow(th_pixels,hl);
    //閾値中心
    var th=(hl.h+hl.l)/2;
    //ヒステリシス(差分の20%)
    var th_sub=(hl.h-hl.l)/5;
    o_threshold.th=th;
    o_threshold.th_h=th+th_sub;//ヒステリシス付き閾値
    o_threshold.th_l=th-th_sub;//ヒステリシス付き閾値
    //エッジを計算(明点重心)
    var lt_x,lt_y,lb_x,lb_y,rt_x,rt_y,rb_x,rb_y;
    var tpt=this.__detectThresholdValue_tpt;
    //LT
    if(this.getHighPixelCenter(0,th_pixels,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,th,tpt)){
      lt_x=tpt.x*this.THRESHOLD_STEP;
      lt_y=tpt.y*this.THRESHOLD_STEP;
    }else{
      lt_x=11;
      lt_y=11;
    }
    //LB
    if(this.getHighPixelCenter(this.THRESHOLD_SAMPLE*1,th_pixels,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,th,tpt)){
      lb_x=tpt.x*this.THRESHOLD_STEP;
      lb_y=tpt.y*this.THRESHOLD_STEP;
    }else{
      lb_x=11;
      lb_y=-1;
    }
    //RT
    if(this.getHighPixelCenter(this.THRESHOLD_SAMPLE*2,th_pixels,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,th,tpt)){
      rt_x=tpt.x*this.THRESHOLD_STEP;
      rt_y=tpt.y*this.THRESHOLD_STEP;
    }else{
      rt_x=-1;
      rt_y=11;
    }
    //RB
    if(this.getHighPixelCenter(this.THRESHOLD_SAMPLE*3,th_pixels,this.THRESHOLD_PIXEL,this.THRESHOLD_PIXEL,th,tpt)){
      rb_x=tpt.x*this.THRESHOLD_STEP;
      rb_y=tpt.y*this.THRESHOLD_STEP;
    }else{
      rb_x=-1;
      rb_y=-1;
    }
    //トラッキング開始位置の決定
    o_threshold.lt_x=(lt_x+lb_x)/2+this.THRESHOLD_SAMPLE_LT-1;
    o_threshold.rb_x=(rt_x+rb_x)/2+this.THRESHOLD_SAMPLE_RB+1;
    o_threshold.lt_y=(lt_y+rt_y)/2+this.THRESHOLD_SAMPLE_LT-1;
    o_threshold.rb_y=(lb_y+rb_y)/2+this.THRESHOLD_SAMPLE_RB+1;
    return;
  }
  ,getHighPixelCenter : function(i_st,i_pixels,i_width,i_height,i_th,o_point)
  {
    var rp=i_st;
    var pos_x=0;
    var pos_y=0;
    var number_of_pos=0;
    for(var i=0;i<i_height;i++){
      for(var i2=0;i2<i_width;i2++){
        if(i_pixels[rp++]>i_th){
          pos_x+=i2;
          pos_y+=i;
          number_of_pos++;
        }
      }
    }
    if(number_of_pos>0){
      pos_x/=number_of_pos;
      pos_y/=number_of_pos;
    }else{
      return false;
    }
    o_point.x=pos_x;
    o_point.y=pos_y;
    return true;
  },
  __detectDataBitsIndex_freq_index1 : new IntVector((100-(5*2))/2/*this.FRQ_POINTS*/),
  __detectDataBitsIndex_freq_index2 : new IntVector((100-(5*2))/2/*this.FRQ_POINTS*/),
  detectDataBitsIndex : function(i_reader,i_raster_size,i_th,o_index_row,o_index_col)
  {
    var i;
    //周波数を測定
    var freq_index1=this.__detectDataBitsIndex_freq_index1;
    var freq_index2=this.__detectDataBitsIndex_freq_index2;
    var lydiff = i_th.rb_y-i_th.lt_y;
    var frq_t=this.getRowFrequency(i_reader,i_raster_size,i_th.lt_y/*-0.25*this.FRQ_EDGE*/,i_th.th_h,i_th.th_l,freq_index1);
    var frq_b=this.getRowFrequency(i_reader,i_raster_size,i_th.rb_y/*-0.5*lydiff*/,i_th.th_h,i_th.th_l,freq_index2);
    //周波数はまとも？
    if((frq_t<0 && frq_b<0) || frq_t==frq_b){
      if (window.DEBUG)
        console.log('bad row frq', frq_t, frq_b)
      return -1;
    }
    //タイミングパターンからインデクスを作成
    var freq_h,freq_v;
    var index;
    if(frq_t>frq_b){
      freq_h=frq_t;
      index=freq_index1;
    }else{
      freq_h=frq_b;
      index=freq_index2;
    }
    for(i=0;i<freq_h+freq_h-1;i++){
      o_index_row[i*2]=((index[i+1]-index[i])*2/5+index[i])+this.FRQ_EDGE;
      o_index_row[i*2+1]=((index[i+1]-index[i])*3/5+index[i])+this.FRQ_EDGE;
    }
    var lxdiff = i_th.rb_x-i_th.lt_x;
    var frq_l=this.getColFrequency(i_reader,i_raster_size,i_th.lt_x/*-0.25*this.FRQ_EDGE*/,i_th.th_h,i_th.th_l,freq_index1);
    var frq_r=this.getColFrequency(i_reader,i_raster_size,i_th.rb_x/*-0.5*lxdiff*/,i_th.th_h,i_th.th_l,freq_index2);
    //周波数はまとも？
    if((frq_l<0 && frq_r<0) || frq_l==frq_r){
      if (window.DEBUG)
        console.log('bad col frq', frq_l, frq_r);
      return -1;
    }
    //タイミングパターンからインデクスを作成
    if(frq_l>frq_r){
      freq_v=frq_l;
      index=freq_index1;
    }else{
      freq_v=frq_r;
      index=freq_index2;
    }
    //同じ周期？
    if(freq_v!=freq_h){
      if (window.DEBUG)
        console.log('freq mismatch', freq_v, freq_h)
      return -1;
    }
    for(i=0;i<freq_v+freq_v-1;i++){
      var w=index[i];
      var w2= index[i + 1] - w;
      o_index_col[i*2]=((w2)*2/5+w)+this.FRQ_EDGE;
      o_index_col[i*2+1]=((w2)*3/5+w)+this.FRQ_EDGE;
    }
    //Lv4以上は無理
    if(freq_v>this.MAX_FREQ){
      if (window.DEBUG)
        console.log('too high freq', freq_v)
      return -1;
    }
    return freq_v;
  },
  __readDataBits_index_bit_x : new FloatVector(19/*MAX_DATA_BITS*/*2),
  __readDataBits_index_bit_y : new FloatVector(19/*MAX_DATA_BITS*/*2),
  previousFrames : {},
  centerPoint : new IntVector(2),
  getPreviousFrameSize : function(index_x, index_y) {
    var cx = this.centerPoint[0], cy = this.centerPoint[1];
    var pfs = this.previousFrames;
    var pf = (
      pfs[cx+":"+cy] || pfs[(cx-1)+":"+cy] || pfs[(cx+1)+":"+cy] ||
      pfs[cx+":"+(cy-1)] || pfs[(cx-1)+":"+(cy-1)] || pfs[(cx+1)+":"+(cy-1)] ||
      pfs[cx+":"+(cy+1)] || pfs[(cx-1)+":"+(cy+1)] || pfs[(cx+1)+":"+(cy+1)]
    );
    if (!pf)
      return -1;
    index_x.set(pf.index_x);
    index_y.set(pf.index_y);
    return pf.size;
  },
  setPreviousFrameSize : function(size, index_x, index_y) {
    var pf = this.previousFrames[this.centerPoint[0]+":"+this.centerPoint[1]];
    if (!pf) {
      pf = {age: 0, size: size, index_x: new FloatVector(index_x), index_y: new FloatVector(index_y)};
      this.previousFrames[this.centerPoint[0]+":"+this.centerPoint[1]] = pf;
      return;
    }
    pf.age = 0;
    pf.size = size;
    pf.index_x.set(index_x);
    pf.index_y.set(index_y);
  },
  readDataBits : function(i_reader, i_raster_size, i_th, o_bitbuffer)
  {
    var index_x=this.__readDataBits_index_bit_x;
    var index_y=this.__readDataBits_index_bit_y;
    //読み出し位置を取得
    var size=this.detectDataBitsIndex(i_reader,i_raster_size,i_th,index_x,index_y);
    if (size<0) {
      size = this.getPreviousFrameSize(index_x, index_y);
    }
    var resolution=size+size-1;
    if(size<0){
      if (window.DEBUG)
        console.log('readDataBits: size < 0');
      return false;
    }
    if(!o_bitbuffer.initEncoder(size-1)){
      if (window.DEBUG)
        console.log('readDataBits: initEncoder');
      return false;
    }
    var cpara=this._cparam;
    var ref_x=this._ref_x;
    var ref_y=this._ref_y;
    var pixcel_temp=this._pixcel_temp;
    var cpara_0=cpara[0];
    var cpara_1=cpara[1];
    var cpara_3=cpara[3];
    var cpara_6=cpara[6];
    var th=i_th.th;
    var p=0;
    for (var i = 0; i < resolution; i++) {
      var i2;
      //1列分のピクセルのインデックス値を計算する。
      var cy0=1+index_y[i*2+0];
      var cy1=1+index_y[i*2+1];
      var cpy0_12=cpara_1*cy0+cpara[2];
      var cpy0_45=cpara[4]*cy0+cpara[5];
      var cpy0_7=cpara[7]*cy0+1.0;
      var cpy1_12=cpara_1*cy1+cpara[2];
      var cpy1_45=cpara[4]*cy1+cpara[5];
      var cpy1_7=cpara[7]*cy1+1.0;
      var pt=0;
      for(i2=0;i2<resolution;i2++)
      {
        var d;
        var cx0=1+index_x[i2*2+0];
        var cx1=1+index_x[i2*2+1];
        var cp6_0=cpara_6*cx0;
        var cpx0_0=cpara_0*cx0;
        var cpx3_0=cpara_3*cx0;
        var cp6_1=cpara_6*cx1;
        var cpx0_1=cpara_0*cx1;
        var cpx3_1=cpara_3*cx1;
        d=cp6_0+cpy0_7;
        ref_x[pt]=toInt((cpx0_0+cpy0_12)/d);
        ref_y[pt]=toInt((cpx3_0+cpy0_45)/d);
        pt++;
        d=cp6_0+cpy1_7;
        ref_x[pt]=toInt((cpx0_0+cpy1_12)/d);
        ref_y[pt]=toInt((cpx3_0+cpy1_45)/d);
        pt++;
        d=cp6_1+cpy0_7;
        ref_x[pt]=toInt((cpx0_1+cpy0_12)/d);
        ref_y[pt]=toInt((cpx3_1+cpy0_45)/d);
        pt++;
        d=cp6_1+cpy1_7;
        ref_x[pt]=toInt((cpx0_1+cpy1_12)/d);
        ref_y[pt]=toInt((cpx3_1+cpy1_45)/d);
        pt++;
      }
      //1行分のピクセルを取得(場合によっては専用アクセサを書いた方がいい)
      i_reader.getPixelSet(ref_x,ref_y,resolution*4,pixcel_temp);
      //グレースケールにしながら、line→mapへの転写
      for(i2=0;i2<resolution;i2++){
        var index=i2*4;
        var pixel=(pixcel_temp[index+0]+pixcel_temp[index+1]+pixcel_temp[index+2]+pixcel_temp[index+3])/(4);
        //暗点を1、明点を0で表現します。
        o_bitbuffer.setBitByBitIndex(p,pixel>th?0:1);
        p++;
      }
    }
    this.setPreviousFrameSize(size, index_x, index_y);
    return true;
  }
  ,setSquare : function(i_vertex)
  {
    if (!this._param_gen.getParam(i_vertex,this._cparam)) {
      return false;
    }
    return true;
  }
})
MarkerPattDecoder = ASKlass('MarkerPattDecoder',
{
  decode : function(model,domain,mask)
  {
  }
})

INyIdMarkerDataEncoder = ASKlass('INyIdMarkerDataEncoder',
{
  encode : function(i_data,o_dest){},
  createDataInstance : function(){}
})
NyIdMarkerDataEncoder_RawBit = ASKlass('NyIdMarkerDataEncoder_RawBit', INyIdMarkerDataEncoder,
{
  _DOMAIN_ID : 0,
  _mod_data : new IntVector([7,31,127,511,2047,4095]),
  encode : function(i_data,o_dest)
  {
    var dest=(o_dest);
    if(i_data.ctrl_domain!=this._DOMAIN_ID){
      return false;
    }
    // calculate marker resolution (amount of data dots per side)
    var resolution_len = (i_data.model * 2 - 1); //trace("resolution", resolution_len);
    // there are (2*model-1)^2 data dots in a marker
    // and the amount of packets in a marker is
    // floor(dataDotCount / 8) + 1  (the +1 is packet 0)
    var packet_length = (((resolution_len * resolution_len)) / 8) + 1; //trace("packet", packet_length);
    var sum = 0;
    for(var i=0;i<packet_length;i++){
      dest.packet[i] = i_data.data[i]; //trace("i_data[",i,"]",i_data.data[i]);
      sum += i_data.data[i];
    }
    // data point check sum calculation
    sum = sum % this._mod_data[i_data.model - 2]; //trace("check dot", i_data.check, sum);
    // compare data point check sum with expected
    if(i_data.check!=sum){
      return false;
    }
    dest.length=packet_length;
    return true;
  }
  ,createDataInstance : function()
  {
    return new NyIdMarkerData_RawBit();
  }
})
NyIdMarkerData_RawBit = ASKlass('NyIdMarkerData_RawBit', INyIdMarkerData,
{
  packet : new IntVector(22),
  length : 0,
  isEqual : function(i_target)
  {
    var s=(i_target);
    if(s.length!=this.length){
      return false;
    }
    for(var i=s.length-1;i>=0;i--){
      if(s.packet[i]!=this.packet[i]){
        return false;
      }
    }
    return true;
  }
  ,copyFrom : function(i_source)
  {
    var s=(i_source);
    ArrayUtils.copyInt(s.packet,0,this.packet,0,s.length);
    this.length=s.length;
    return;
  }
})
