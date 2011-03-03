/*
 * PROJECT: FLARToolKit
 * --------------------------------------------------------------------------------
 * This work is based on the NyARToolKit developed by
 *   R.Iizuka (nyatla)
 * http://nyatla.jp/nyatoolkit/
 *
 * The FLARToolKit is ActionScript 3.0 version ARToolkit class library.
 * Copyright (C)2008 Saqoosha
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this framework; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * For further information please contact.
 *  http://www.libspark.org/wiki/saqoosha/FLARToolKit
 *  <saq(at)saqoosha.net>
 *
 *  http://nyatla.jp/nyatoolkit/
 *  <airmail(at)ebony.plala.or.jp> or <nyatla(at)nyatla.jp>
 *
 * For further information of this class, please contact.
 * http://sixwish.jp
 * <rokubou(at)gmail.com>
 */

/**
 * ...
 * @author tarotarorg
 */
FLARIdMarkerData = ASKlass('FLARIdMarkerData',
{
  /**
   * パケットデータをVectorで表現。（最大パケット数がモデル7での21+(1)なので、22で初期化している）
   */
  _packet : new IntVector(22)
  ,_model : 0
  ,_controlDomain : 0
  ,_controlMask : 0
  ,_check : 0
  ,_dataDot : 0
  ,packetLength : 0
  ,FLARIdMarkerData : function()
  {
  }
  ,isEqual : function(i_target)
  {
    if (i_target == null || !(i_target instanceof FLARIdMarkerData)) {
      return false;
    }
    var s = i_target;
    if (s.packetLength != this.packetLength    ||
      s._check != this._check          ||
      s._controlDomain != this._controlDomain  ||
      s._controlMask != this._controlMask    ||
      s._dataDot != this._dataDot        ||
      s._model != this._model){
      return false;
    }
    for(var i = s.packetLength - 1; i>=0; i--){
      if(s._packet[i] != this._packet[i]){
        return false;
      }
    }
    return true;
  }
  ,copyFrom : function(i_source)
  {
    var s = i_source;
    if (s == null) return;
    this._check = s._check;
    this._controlDomain = s._controlDomain;
    this._controlMask = s._controlMask;
    this._dataDot = s._dataDot;
    this._model = s._model;
    this.packetLength = s.packetLength;
    for (var i = s.packetLength - 1; i >= 0; i--) {
      this._packet[i] = s._packet[i];
    }
    return;
  }
///////////////////////////////////////////////////////////////////////////////////
// setters
///////////////////////////////////////////////////////////////////////////////////
  ,setModel : function(value)
  {
    this._model = value;
  }
  ,setControlDomain : function(value)
  {
    this._controlDomain = value;
  }
  ,setControlMask : function(value)
  {
    this._controlMask = value;
  }
  ,setCheck : function(value)
  {
    this._check = value;
  }
  ,setPacketData : function(index, data)
  {
    if (index < this.packetLength) {
      this._packet[index] = data;
    } else {
      throw ("packet index over " + index + " >= " + this.packetLength);
    }
  }
  ,setDataDotLength : function(value)
  {
    this._dataDot = value;
  }
  ,setPacketLength : function(value)
  {
    this.packetLength = value;
  }
///////////////////////////////////////////////////////////////////////////////////
// getters
///////////////////////////////////////////////////////////////////////////////////
  ,dataDotLength : function() { return this._dataDot; }
  ,model : function() { return this._model; }
  ,controlDomain : function() { return this._controlDomain; }
  ,controlMask : function() { return this._controlMask; }
  ,check : function() { return this._check; }
  ,getPacketData : function(index)
  {
    if (this.packetLength <= index) throw new ArgumentError("packet index over");
    return this._packet[index];
  }
})


FLARDetectIdMarkerResult = ASKlass('FLARDetectIdMarkerResult',
{
  arcode_id : 0
  ,direction : 0
  ,markerdata : new FLARIdMarkerData()
  ,square : new NyARSquare()
})
FLARDetectIdMarkerResultStack = ASKlass('FLARDetectIdMarkerResultStack', NyARObjectStack,
{
  FLARDetectIdMarkerResultStack : function(i_length)
  {
    NyARObjectStack.initialize.call(this,i_length);
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(i_length);
    for (var i =0; i < i_length; i++){
      ret[i] = new FLARDetectIdMarkerResult();
    }
    return (ret);
  }
})

/**
 * detectMarkerのコールバック関数
 */
FLARMultiIdMarkerDetectCB = ASKlass('FLARMultiIdMarkerDetectCB',
{
  //公開プロパティ
  result_stack : new FLARDetectIdMarkerResultStack(NyARDetectMarker.AR_SQUARE_MAX)
  ,square : new FLARSquare()
  ,marker_data : null
  ,threshold : 0
  ,direction : 0
  ,_ref_raster : null
  ,_current_data : null
  ,_data_temp : null
  ,_prev_data : null
  ,_id_pickup : new NyIdMarkerPickup()
  ,_coordline : null
  ,_encoder : null
  ,__tmp_vertex : NyARIntPoint2d.createArray(4)
  ,_marker_param : new NyIdMarkerParam()
  ,_maker_pattern : new NyIdMarkerPattern()
  ,FLARMultiIdMarkerDetectCB : function(i_param,i_encoder)
  {
    this._coordline=new NyARCoord2Linear(i_param.getScreenSize(),i_param.getDistortionFactor());
    this._data_temp=i_encoder.createDataInstance();
    this._current_data=i_encoder.createDataInstance();
    this._encoder=i_encoder;
    return;
  }
  /**
   * Initialize call back handler.
   */
  ,init : function(i_raster)
  {
    this.marker_data=null;
    this.result_stack.clear();
    this._id_pickup.init();
    this._ref_raster=i_raster;
  }
  ,_previous_verts : {}
  /**
   * 矩形が見付かるたびに呼び出されます。
   * 発見した矩形のパターンを検査して、方位を考慮した頂点データを確保します。
   */
  ,onSquareDetect : function(i_sender,i_coordx,i_coordy,i_coor_num,i_vertex_index)
  {
    //輪郭座標から頂点リストに変換
    var vertex=this.__tmp_vertex;
    vertex[0].x=i_coordx[i_vertex_index[0]];
    vertex[0].y=i_coordy[i_vertex_index[0]];
    vertex[1].x=i_coordx[i_vertex_index[1]];
    vertex[1].y=i_coordy[i_vertex_index[1]];
    vertex[2].x=i_coordx[i_vertex_index[2]];
    vertex[2].y=i_coordy[i_vertex_index[2]];
    vertex[3].x=i_coordx[i_vertex_index[3]];
    vertex[3].y=i_coordy[i_vertex_index[3]];
    var param=this._marker_param;
    var patt_data=this._maker_pattern;
    // 評価基準になるパターンをイメージから切り出す
    var cv;
    if (window.DEBUG) {
      cv = document.getElementById('debugCanvas').getContext('2d');
      cv.fillStyle = 'blue';
      for (var i=0; i<4; i++) {
        cv.fillRect(vertex[i].x-2, vertex[i].y-2, 5, 5);
      }
    }
    var cx=0,cy=0;
    for (var i=0; i<4; i++) {
      cx += vertex[i].x;
      cy += vertex[i].y;
    }
    cx /= 4;
    cy /= 4;
    var pick = this._id_pickup.pickFromRaster(this._ref_raster,vertex, patt_data, param);
    if (!pick) {
      if (window.DEBUG) {
        cv.fillStyle = '#ff0000';
        cv.fillText('No pick', cx+3, cy);
      }
      return;
    }
    //エンコード
    var enc = this._encoder.encode(patt_data,this._data_temp);
    if(!enc){
      return;
    }
    this._current_data.copyFrom(this._data_temp);
    this.marker_data = this._current_data;//みつかった。
    this.threshold = param.threshold;
    this.direction = param.direction;
    //マーカ情報を記録する。
    var result = this.result_stack.prePush();
    result.direction = this.direction;
    result.markerdata.copyFrom(this.marker_data);
    result.arcode_id = this.getId(result.markerdata);
    if (window.DEBUG) {
      cv.fillStyle = '#00ffff';
      cv.fillText(result.arcode_id, cx+3, cy);
    }
    //新しく認識、または継続認識中に更新があったときだけ、Square情報を更新する。
    //ココから先はこの条件でしか実行されない。
    var sq = result.square;
    //directionを考慮して、squareを更新する。
    var i;
    for(i=0;i<4;i++){
      var idx=(i+4 - param.direction) % 4;
      this._coordline.coord2Line(i_vertex_index[idx],i_vertex_index[(idx+1)%4],i_coordx,i_coordy,i_coor_num,sq.line[i]);
    }
    for (i= 0; i < 4; i++) {
      //直線同士の交点計算
      if(!NyARLinear.crossPos(sq.line[i],sq.line[(i + 3) % 4],sq.sqvertex[i])){
        throw new NyARException();//ここのエラー復帰するならダブルバッファにすればOK
      }
    }
  }
  ,getId : function(data)
  {
    var currId;
    if (data.packetLength > 4) {
      currId = -1;
    }else{
      currId=0;
      //最大4バイト繋げて１個のint値に変換
      for (var i = 0; i < data.packetLength; i++ ) {
        currId = (currId << 8) | data.getPacketData(i);
      }
    }
    return currId;
  }
})

FLARMultiIdMarkerDetector = ASKlass('FLARMultiIdMarkerDetector',
{
  _is_continue : false
  ,_square_detect : null
  ,_offset : null
  ,_current_threshold : 110
  // [AR]検出結果の保存用
  ,_bin_raster : null
  ,_tobin_filter : null
  ,_callback : null
  ,_data_current : null
  ,_threshold_detect : null
  ,_transmat : null
  ,FLARMultiIdMarkerDetector : function(i_param ,i_marker_width)
  {
    var scr_size = i_param.getScreenSize();
    var encoder = new FLARIdMarkerDataEncoder_RawBit();
    // 解析オブジェクトを作る
    this._square_detect = new FLARSquareContourDetector(scr_size);
    this._callback = new FLARMultiIdMarkerDetectCB(i_param, encoder);
    this._transmat = new NyARTransMat(i_param);
    // ２値画像バッファを作る
    this._bin_raster = new FLARBinRaster(scr_size.w, scr_size.h);
    //ワーク用のデータオブジェクトを２個作る
    this._data_current = encoder.createDataInstance();
    this._tobin_filter = new FLARRasterFilter_Threshold(110);
    this._threshold_detect = new FLARRasterThresholdAnalyzer_SlidePTile(15, 4);
    this._offset = new NyARRectOffset();
    this._offset.setSquare(i_marker_width);
    return;
  }
  ,detectMarkerLite : function(i_raster, i_threshold)
  {
    // サイズチェック
    if (!this._bin_raster.getSize().isEqualSize_int(i_raster.getSize().w, i_raster.getSize().h)) {
      throw new FLARException();
    }
    // ラスタを２値イメージに変換する.
    this._tobin_filter.setThreshold(i_threshold);
    this._tobin_filter.doFilter(i_raster, this._bin_raster);
    // スクエアコードを探す(第二引数に指定したマーカ、もしくは新しいマーカを探す。)
    this._callback.init(this._bin_raster);
    this._square_detect.detectMarkerCB(this._bin_raster, this._callback);
    //見付かった数を返す。
    return this._callback.result_stack.getLength();
  }
  /**
   * i_indexのマーカーに対する変換行列を計算し、結果値をo_resultへ格納します。 直前に実行したdetectMarkerLiteが成功していないと使えません。
   *
   * @param i_index
   * マーカーのインデックス番号を指定します。 直前に実行したdetectMarkerLiteの戻り値未満かつ0以上である必要があります。
   * @param o_result
   * 結果値を受け取るオブジェクトを指定してください。
   * @throws NyARException
   */
  ,getTransformMatrix : function(i_index, o_result)
  {
    var result = this._callback.result_stack.getItem(i_index);
    // 一番一致したマーカーの位置とかその辺を計算
    if (this._is_continue) {
      this._transmat.transMatContinue(result.square, this._offset, o_result);
    } else {
      this._transmat.transMat(result.square, this._offset, o_result);
    }
    return;
  }
  ,getIdMarkerData : function(i_index)
  {
    var result = new FLARIdMarkerData();
    result.copyFrom(this._callback.result_stack.getItem(i_index).markerdata);
    return result;
  }
  /**
   * i_indexのマーカーのARCodeインデックスを返します。
   *
   * @param i_index
   * マーカーのインデックス番号を指定します。 直前に実行したdetectMarkerLiteの戻り値未満かつ0以上である必要があります。
   * @return
   */
  ,getARCodeIndex : function(i_index)
  {
    return this._callback.result_stack.getItem(i_index).arcode_id;
  }
  /**
   * 検出したマーカーの方位を返します。
   * 0,1,2,3の何れかを返します。
   *
   * @return Returns whether any of 0,1,2,3.
   */
  ,getDirection : function(i_index)
  {
    return this._callback.result_stack.getItem(i_index).direction;
  }
  /**
   * 検出した FLARSquare 1 個返す。検出できなかったら null。
   * @return Total return detected FLARSquare 1. Detection Dekinakattara null.
   */
  ,getSquare : function(i_index)
  {
    return this._callback.result_stack.getItem(i_index).square;
  }
  /**
   * getTransmationMatrixの計算モードを設定します。
   *
   * @param i_is_continue
   * TRUEなら、transMatContinueを使用します。 FALSEなら、transMatを使用します。
   */
  ,setContinueMode : function(i_is_continue)
  {
    this._is_continue = i_is_continue;
  }
  /**
   * 2値化した画像を返却します。
   *
   * @return 画像情報を返却します
   */
  ,thresholdedBitmapData : function()
  {
    try {
      return ((this._bin_raster).getBuffer());
    } catch (e) {
      return null;
    }
    return null;
  }
})
/**
 * detectMarkerのコールバック関数
 */
FLARSingleIdMarkerDetectCB = ASKlass('FLARSingleIdMarkerDetectCB',
{
  //公開プロパティ
  square : new FLARSquare()
  ,marker_data : null
  ,threshold : 0
  ,direction : 0
  ,_ref_raster : null
  ,_current_data : null
  ,_data_temp : null
  ,_prev_data : null
  ,_id_pickup : new NyIdMarkerPickup()
  ,_coordline : null
  ,_encoder : null
  ,__tmp_vertex : NyARIntPoint2d.createArray(4)
  ,_marker_param : new NyIdMarkerParam()
  ,_maker_pattern : new NyIdMarkerPattern()
  ,FLARSingleIdMarkerDetectCB : function(i_param,i_encoder)
  {
    this._coordline=new NyARCoord2Linear(i_param.getScreenSize(),i_param.getDistortionFactor());
    this._data_temp=i_encoder.createDataInstance();
    this._current_data=i_encoder.createDataInstance();
    this._encoder=i_encoder;
    return;
  }
  /**
   * Initialize call back handler.
   */
  ,init : function(i_raster,i_prev_data)
  {
    this.marker_data=null;
    this._prev_data=i_prev_data;
    this._ref_raster=i_raster;
  }
  /**
   * 矩形が見付かるたびに呼び出されます。
   * 発見した矩形のパターンを検査して、方位を考慮した頂点データを確保します。
   */
  ,onSquareDetect : function(i_sender,i_coordx,i_coordy,i_coor_num,i_vertex_index)
  {
    //既に発見済なら終了
    if(this.marker_data!=null){
      return;
    }
    //輪郭座標から頂点リストに変換
    var vertex=this.__tmp_vertex;
    vertex[0].x=i_coordx[i_vertex_index[0]];
    vertex[0].y=i_coordy[i_vertex_index[0]];
    vertex[1].x=i_coordx[i_vertex_index[1]];
    vertex[1].y=i_coordy[i_vertex_index[1]];
    vertex[2].x=i_coordx[i_vertex_index[2]];
    vertex[2].y=i_coordy[i_vertex_index[2]];
    vertex[3].x=i_coordx[i_vertex_index[3]];
    vertex[3].y=i_coordy[i_vertex_index[3]];
    var param=this._marker_param;
    var patt_data=this._maker_pattern;
    // 評価基準になるパターンをイメージから切り出す
    var pick = this._id_pickup.pickFromRaster(this._ref_raster,vertex, patt_data, param)
    if (window.DEBUG) {
      var cv = document.getElementById('debugCanvas').getContext('2d');
      cv.fillStyle = 'blue';
      for (var i=0; i<4; i++) {
        cv.fillRect(vertex[i].x-2, vertex[i].y-2, 5, 5);
      }
    }
    if (!pick){
      return;
    }
    this.direction = param.direction;
    //エンコード
    if(!this._encoder.encode(patt_data,this._data_temp)){
      return;
    }
    //継続認識要求されている？
    if (this._prev_data==null){
      //継続認識要求なし
      this._current_data.copyFrom(this._data_temp);
    }else{
      //継続認識要求あり
      if(!this._prev_data.isEqual((this._data_temp))){
        return;//認識請求のあったIDと違う。
      }
    }
    //新しく認識、または継続認識中に更新があったときだけ、Square情報を更新する。
    //ココから先はこの条件でしか実行されない。
    var sq=this.square;
    //directionを考慮して、squareを更新する。
    var i;
    for(i=0;i<4;i++){
      var idx=(i+4 - param.direction) % 4;
      this._coordline.coord2Line(i_vertex_index[idx],i_vertex_index[(idx+1)%4],i_coordx,i_coordy,i_coor_num,sq.line[i]);
    }
    for (i= 0; i < 4; i++) {
      //直線同士の交点計算
      if(!NyARLinear.crossPos(sq.line[i],sq.line[(i + 3) % 4],sq.sqvertex[i])){
        throw new NyARException();//ここのエラー復帰するならダブルバッファにすればOK
      }
    }
    this.threshold=param.threshold;
    this.marker_data=this._current_data;//みつかった。
  }
})
FLARSingleIdMarkerDetector = ASKlass('FLARSingleIdMarkerDetector', {
  _is_continue : false
  ,_square_detect : null
  ,_offset : null
  ,_is_active : null
  ,_current_threshold : 110
  // [AR]検出結果の保存用
  ,_bin_raster : null
  ,_tobin_filter : null
  ,_callback : null
  ,_data_current : null
  ,_threshold_detect : null
  ,_transmat : null
  ,FLARSingleIdMarkerDetector : function(i_param ,i_marker_width)
  {
    var scr_size = i_param.getScreenSize();
    var encoder = new FLARIdMarkerDataEncoder_RawBit();
    // 解析オブジェクトを作る
    this._square_detect = new FLARSquareContourDetector(scr_size);
    this._callback = new FLARSingleIdMarkerDetectCB(i_param, encoder);
    this._transmat = new NyARTransMat(i_param);
    // ２値画像バッファを作る
    this._bin_raster = new FLARBinRaster(scr_size.w, scr_size.h);
    //ワーク用のデータオブジェクトを２個作る
    this._data_current = encoder.createDataInstance();
    this._tobin_filter = new FLARRasterFilter_Threshold(110);
    this._threshold_detect = new FLARRasterThresholdAnalyzer_SlidePTile(15, 4);
    this._offset = new NyARRectOffset();
    this._offset.setSquare(i_marker_width);
    return;
  }
  ,detectMarkerLite : function(i_raster, i_threshold)
  {
    // サイズチェック
    if (!this._bin_raster.getSize().isEqualSize_int(i_raster.getSize().w, i_raster.getSize().h)) {
      throw new FLARException();
    }
    // ラスタを２値イメージに変換する.
    this._tobin_filter.setThreshold(i_threshold);
    this._tobin_filter.doFilter(i_raster, this._bin_raster);
    // スクエアコードを探す(第二引数に指定したマーカ、もしくは新しいマーカを探す。)
    this._callback.init(this._bin_raster, this._is_active?this._data_current:null);
    this._square_detect.detectMarkerCB(this._bin_raster, this._callback);
    // 見つからない場合はfalse
    if(this._callback.marker_data==null){
      this._is_active=false;
      return false;
    }
    this._is_active = true;
    this._data_current.copyFrom(this._callback.marker_data);
    return true;
  }
  ,getIdMarkerData : function()
  {
    var result = new FLARIdMarkerData();
    result.copyFrom(this._callback.marker_data);
    return result;
  }
  ,getDirection : function()
  {
    return this._callback.direction;
  }
  ,getTransformMatrix : function(o_result)
  {
    if (this._is_continue) this._transmat.transMatContinue(this._callback.square, this._offset, o_result);
    else this._transmat.transMat(this._callback.square, this._offset, o_result);
    return;
  }
  ,setContinueMode : function(i_is_continue)
  {
    this._is_continue = i_is_continue;
  }
})

FLARIdMarkerDataEncoder_RawBit = ASKlass('FLARIdMarkerDataEncoder_RawBit',
{
  _DOMAIN_ID : 0
  /**
   * 制御ドット作成時のmodに使う値
   */
  ,_mod_data : new IntVector([7, 31, 127, 511, 2047, 4095])
  ,encode : function(i_data,o_dest)
  {
    var dest = o_dest;
    if (dest == null) {
      throw new FLARException("type of o_dest must be \"FLARIdMarkerData\"");
    }
    if(i_data.ctrl_domain != this._DOMAIN_ID) {
      return false;
    }
    dest.setCheck(i_data.check);
    dest.setControlDomain(i_data.ctrl_domain);
    dest.setControlMask(i_data.ctrl_mask);
    dest.setModel(i_data.model);
    //データドット数計算
    var resolution_len = toInt(i_data.model * 2 - 1); //trace("resolution", resolution_len);
    dest.setDataDotLength(resolution_len);
    //データドット数が、「(2 * model値 - 1)^2」となり、この2乗の元となる値がresolution_lenで、
    //パケット数は「(int)(データドット数 / 8) + 1」（最後に足す1はパケット0）となる
    var packet_length = toInt((resolution_len * resolution_len) / 8) + 1;
    // trace("packet", packet_length);
    dest.setPacketLength(packet_length);
    var sum = 0;
    for(var i=0;i<packet_length;i++){
      dest.setPacketData(i, i_data.data[i]);
      // trace("i_data[",i,"]",i_data.data[i]);
      sum += i_data.data[i];
    }
    //チェックドット値計算
    sum = sum % this._mod_data[i_data.model - 2];
    // trace("check dot", i_data.check, sum);
    //チェックドット比較
    if(i_data.check!=sum){
      return false;
    }
    return true;
  }
  ,createDataInstance : function()
  {
    return new FLARIdMarkerData();
  }
})
