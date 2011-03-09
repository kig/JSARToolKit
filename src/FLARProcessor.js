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
 *  http://www.libspark.org/wiki/saqoosha/FLARToolKit
 *  <saq(at)saqoosha.net>
 *
 */

/**
 * このクラスは、同時に１個のマーカを処理することのできる、アプリケーションプロセッサです。
 * マーカの出現・移動・消滅を、イベントで通知することができます。
 * クラスには複数のマーカを登録できます。一つのマーカが見つかると、プロセッサは継続して同じマーカを
 * １つだけ認識し続け、見失うまでの間は他のマーカを認識しません。
 *
 * イベントは、 OnEnter→OnUpdate[n]→OnLeaveの順で発生します。
 * マーカが見つかるとまずOnEnterが１度発生して、何番のマーカが発見されたかがわかります。
 * 次にOnUpdateにより、現在の変換行列が連続して渡されます。最後にマーカを見失うと、OnLeave
 * イベントが発生します。
 *
 */
FLSingleARMarkerProcesser = ASKlass('FLSingleARMarkerProcesser',
{
  /**オーナーが自由に使えるタグ変数です。
   */
  tag : null
  ,_lost_delay_count : 0
  ,_lost_delay : 5
  ,_square_detect : null
  ,_transmat : null
  ,_offset : null
  ,_threshold : 110
  // [AR]検出結果の保存用
  ,_bin_raster : null
  ,_tobin_filter : null
  ,_current_arcode_index : -1
  ,_threshold_detect : null
  ,FLSingleARMarkerProcesser : function()
  {
    return;
  }
  ,_initialized : false
  ,initInstance : function(i_param)
  {
    //初期化済？
    NyAS3Utils.assert(this._initialized==false);
    var scr_size = i_param.getScreenSize();
    // 解析オブジェクトを作る
    this._square_detect = new FLARSquareContourDetector(scr_size);
    this._transmat = new NyARTransMat(i_param);
    this._tobin_filter=new FLARRasterFilter_Threshold(110);
    // ２値画像バッファを作る
    this._bin_raster = new FLARBinRaster(scr_size.w, scr_size.h);
    this._threshold_detect=new FLARRasterThresholdAnalyzer_SlidePTile(15,4);
    this._initialized=true;
    //コールバックハンドラ
    this._detectmarker_cb=new FLARDetectSquareCB_1(i_param);
    this._offset=new NyARRectOffset();
    return;
  }
  /*自動・手動の設定が出来ないので、コメントアウト
  public void setThreshold(int i_threshold)
  {
    this._threshold = i_threshold;
    return;
  }*/
  /**検出するマーカコードの配列を指定します。 検出状態でこの関数を実行すると、
   * オブジェクト状態に強制リセットがかかります。
   */
  ,setARCodeTable : function(i_ref_code_table,i_code_resolution,i_marker_width)
  {
    if (this._current_arcode_index != -1) {
      // 強制リセット
      this.reset(true);
    }
    //検出するマーカセット、情報、検出器を作り直す。(1ピクセル4ポイントサンプリング,マーカのパターン領域は50%)
    this._detectmarker_cb.setNyARCodeTable(i_ref_code_table,i_code_resolution);
    this._offset.setSquare(i_marker_width);
    return;
  }
  ,reset : function(i_is_force)
  {
    if (this._current_arcode_index != -1 && i_is_force == false) {
      // 強制書き換えでなければイベントコール
      this.onLeaveHandler();
    }
    // カレントマーカをリセット
    this._current_arcode_index = -1;
    return;
  }
  ,_detectmarker_cb : null
  ,detectMarker : function(i_raster)
  {
    // サイズチェック
    NyAS3Utils.assert(this._bin_raster.getSize().isEqualSize_int(i_raster.getSize().w, i_raster.getSize().h));
    //BINイメージへの変換
    this._tobin_filter.setThreshold(this._threshold);
    this._tobin_filter.doFilter(i_raster, this._bin_raster);
    // スクエアコードを探す
    this._detectmarker_cb.init(i_raster,this._current_arcode_index);
    this._square_detect.detectMarkerCB(this._bin_raster,this._detectmarker_cb);
    // 認識状態を更新
    var is_id_found=updateStatus(this._detectmarker_cb.square,this._detectmarker_cb.code_index);
    //閾値フィードバック(detectExistMarkerにもあるよ)
    if(!is_id_found){
      //マーカがなければ、探索+DualPTailで基準輝度検索
      var th=this._threshold_detect.analyzeRaster(i_raster);
      this._threshold=(this._threshold+th)/2;
    }
    return;
  }
  /**
   *
   * @param i_new_detect_cf
   * @param i_exist_detect_cf
   */
  ,setConfidenceThreshold : function(i_new_cf,i_exist_cf)
  {
    this._detectmarker_cb.cf_threshold_exist=i_exist_cf;
    this._detectmarker_cb.cf_threshold_new=i_new_cf;
  }
  ,__NyARSquare_result : new FLARTransMatResult()
  /**  オブジェクトのステータスを更新し、必要に応じてハンドル関数を駆動します。
   *   戻り値は、「実際にマーカを発見する事ができたか」です。クラスの状態とは異なります。
   */
  ,updateStatus : function(i_square,i_code_index)
  {
    var result = this.__NyARSquare_result;
    if (this._current_arcode_index < 0) {// 未認識中
      if (i_code_index < 0) {// 未認識から未認識の遷移
        // なにもしないよーん。
        return false;
      } else {// 未認識から認識の遷移
        this._current_arcode_index = i_code_index;
        // イベント生成
        // OnEnter
        this.onEnterHandler(i_code_index);
        // 変換行列を作成
        this._transmat.transMat(i_square, this._offset, result);
        // OnUpdate
        this.onUpdateHandler(i_square, result);
        this._lost_delay_count = 0;
        return true;
      }
    } else {// 認識中
      if (i_code_index < 0) {// 認識から未認識の遷移
        this._lost_delay_count++;
        if (this._lost_delay < this._lost_delay_count) {
          // OnLeave
          this._current_arcode_index = -1;
          this.onLeaveHandler();
        }
        return false;
      } else if (i_code_index == this._current_arcode_index) {// 同じARCodeの再認識
        // イベント生成
        // 変換行列を作成
        this._transmat.transMat(i_square, this._offset, result);
        // OnUpdate
        this.onUpdateHandler(i_square, result);
        this._lost_delay_count = 0;
        return true;
      } else {// 異なるコードの認識→今はサポートしない。
        throw new  NyARException();
      }
    }
  }
  ,onEnterHandler : function(i_code)
  {
    throw new NyARException("onEnterHandler not implemented.");
  }
  ,onLeaveHandler : function()
  {
    throw new NyARException("onLeaveHandler not implemented.");
  }
  ,onUpdateHandler : function(i_square, result)
  {
    throw new NyARException("onUpdateHandler not implemented.");
  }
})

/**
 * detectMarkerのコールバック関数
 */
FLARDetectSquareCB_1 = ASKlass('DetectSquareCB',
{
  //公開プロパティ
  square : new FLARSquare()
  ,confidence : 0.0
  ,code_index : -1
  ,cf_threshold_new : 0.50
  ,cf_threshold_exist : 0.30
  //参照
  ,_ref_raster : null
  //所有インスタンス
  ,_inst_patt : null
  ,_deviation_data : null
  ,_match_patt : null
  ,__detectMarkerLite_mr : new NyARMatchPattResult()
  ,_coordline : null
  ,DetectSquareCB : function(i_param)
  {
    this._match_patt=null;
    this._coordline=new NyARCoord2Linear(i_param.getScreenSize(),i_param.getDistortionFactor());
    return;
  }
  ,setNyARCodeTable : function(i_ref_code,i_code_resolution)
  {
    /*unmanagedで実装するときは、ここでリソース解放をすること。*/
    this._deviation_data=new NyARMatchPattDeviationColorData(i_code_resolution,i_code_resolution);
    this._inst_patt=new NyARColorPatt_Perspective_O2(i_code_resolution,i_code_resolution,4,25);
    this._match_patt = new Array(i_ref_code.length);
    for(var i=0;i<i_ref_code.length;i++){
      this._match_patt[i]=new NyARMatchPatt_Color_WITHOUT_PCA(i_ref_code[i]);
    }
  }
  ,__tmp_vertex : NyARIntPoint2d.createArray(4)
  ,_target_id : 0
  /**
  * Initialize call back handler.
  */
  ,init : function(i_raster,i_target_id)
  {
    this._ref_raster=i_raster;
    this._target_id=i_target_id;
    this.code_index=-1;
    this.confidence = Number.MIN_VALUE;
  }
  /**
  * 矩形が見付かるたびに呼び出されます。
  * 発見した矩形のパターンを検査して、方位を考慮した頂点データを確保します。
  */
  ,onSquareDetect : function(i_sender,i_coordx,i_coordy,i_coor_num,i_vertex_index)
  {
    if (this._match_patt==null) {
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
    //画像を取得
    if (!this._inst_patt.pickFromRaster(this._ref_raster,vertex)){
      return;//取得失敗
    }
    //取得パターンをカラー差分データに変換して評価する。
    this._deviation_data.setRaster(this._inst_patt);
    //code_index,dir,c1にデータを得る。
    var mr=this.__detectMarkerLite_mr;
    var lcode_index = 0;
    var dir = 0;
    var c1 = 0;
    var i;
    for (i = 0; i < this._match_patt.length; i++) {
      this._match_patt[i].evaluate(this._deviation_data,mr);
      var c2 = mr.confidence;
      if (c1 < c2) {
        lcode_index = i;
        c1 = c2;
        dir = mr.direction;
      }
    }
    //認識処理
    if (this._target_id == -1) { // マーカ未認識
      //現在は未認識
      if (c1 < this.cf_threshold_new) {
        return;
      }
      if (this.confidence > c1) {
        // 一致度が低い。
        return;
      }
      //認識しているマーカIDを保存
      this.code_index=lcode_index;
    }else{
      //現在はマーカ認識中
      // 現在のマーカを認識したか？
      if (lcode_index != this._target_id) {
        // 認識中のマーカではないので無視
        return;
      }
      //認識中の閾値より大きいか？
      if (c1 < this.cf_threshold_exist) {
        return;
      }
      //現在の候補よりも一致度は大きいか？
      if (this.confidence>c1) {
        return;
      }
      this.code_index=this._target_id;
    }
    //新しく認識、または継続認識中に更新があったときだけ、Square情報を更新する。
    //ココから先はこの条件でしか実行されない。
    //一致率の高い矩形があれば、方位を考慮して頂点情報を作成
    this.confidence=c1;
    var sq=this.square;
    //directionを考慮して、squareを更新する。
    for(i=0;i<4;i++){
      var idx=(i+4 - dir) % 4;
      this._coordline.coord2Line(i_vertex_index[idx],i_vertex_index[(idx+1)%4],i_coordx,i_coordy,i_coor_num,sq.line[i]);
    }
    for (i = 0; i < 4; i++) {
      //直線同士の交点計算
      if(!NyARLinear.crossPos(sq.line[i],sq.line[(i + 3) % 4],sq.sqvertex[i])){
        throw new NyARException();//ここのエラー復帰するならダブルバッファにすればOK
      }
    }
  }
})

FLSingleNyIdMarkerProcesser = ASKlass('FLSingleNyIdMarkerProcesser',
{
  /**
   * オーナーが自由に使えるタグ変数です。
   */
  tag : null
  /**
   * ロスト遅延の管理
   */
  ,_lost_delay_count : 0
  ,_lost_delay : 5
  ,_square_detect : null
  ,_transmat : null
  ,_offset : null
  ,_is_active : null
  ,_current_threshold : 110
  // [AR]検出結果の保存用
  ,_bin_raster : null
  ,_tobin_filter : null
  ,_callback : null
  ,_data_current : null
  ,FLSingleNyIdMarkerProcesser : function()
  {
    return;
  }
  ,_initialized : false
  ,initInstance : function(i_param, i_encoder ,i_marker_width)
  {
    //初期化済？
    NyAS3Utils.assert(this._initialized==false);
    var scr_size = i_param.getScreenSize();
    // 解析オブジェクトを作る
    this._square_detect = new FLARSquareContourDetector(scr_size);
    this._transmat = new NyARTransMat(i_param);
    this._callback=new FLARDetectSquareCB_2(i_param,i_encoder);
    // ２値画像バッファを作る
    this._bin_raster = new FLARBinRaster(scr_size.w, scr_size.h);
    //ワーク用のデータオブジェクトを２個作る
    this._data_current=i_encoder.createDataInstance();
    this._tobin_filter =new FLARRasterFilter_Threshold(110);
    this._threshold_detect=new FLARRasterThresholdAnalyzer_SlidePTile(15,4);
    this._initialized=true;
    this._is_active=false;
    this._offset = new NyARRectOffset();
    this._offset.setSquare(i_marker_width);
    return;
  }
  ,setMarkerWidth : function(i_width)
  {
    this._offset.setSquare(i_width);
    return;
  }
  ,reset : function(i_is_force)
  {
    if (i_is_force == false && this._is_active){
      // 強制書き換えでなければイベントコール
      this.onLeaveHandler();
    }
    //マーカ無効
    this._is_active=false;
    return;
  }
  ,detectMarker : function(i_raster)
  {
    // サイズチェック
    if (!this._bin_raster.getSize().isEqualSize_int(i_raster.getSize().w, i_raster.getSize().h)) {
      throw new NyARException();
    }
    // ラスタを２値イメージに変換する.
    this._tobin_filter.setThreshold(this._current_threshold);
    this._tobin_filter.doFilter(i_raster, this._bin_raster);
    // スクエアコードを探す(第二引数に指定したマーカ、もしくは新しいマーカを探す。)
    this._callback.init(i_raster,this._is_active?this._data_current:null);
    this._square_detect.detectMarkerCB(this._bin_raster, this._callback);
    // 認識状態を更新(マーカを発見したなら、current_dataを渡すかんじ)
    var is_id_found=updateStatus(this._callback.square,this._callback.marker_data);
    //閾値フィードバック(detectExistMarkerにもあるよ)
    if(is_id_found){
      //マーカがあれば、マーカの周辺閾値を反映
      this._current_threshold=(this._current_threshold+this._callback.threshold)/2;
    }else{
      //マーカがなければ、探索+DualPTailで基準輝度検索
      var th=this._threshold_detect.analyzeRaster(i_raster);
      this._current_threshold=(this._current_threshold+th)/2;
    }
    return;
  }
  ,_threshold_detect : null
  ,__NyARSquare_result : new FLARTransMatResult()
  /**オブジェクトのステータスを更新し、必要に応じてハンドル関数を駆動します。
   */
  ,updateStatus : function(i_square,i_marker_data)
  {
    var is_id_found=false;
    var result = this.__NyARSquare_result;
    if (!this._is_active) {// 未認識中
      if (i_marker_data==null) {// 未認識から未認識の遷移
        // なにもしないよーん。
        this._is_active=false;
      } else {// 未認識から認識の遷移
        this._data_current.copyFrom(i_marker_data);
        // イベント生成
        // OnEnter
        this.onEnterHandler(this._data_current);
        // 変換行列を作成
        this._transmat.transMat(i_square, this._offset, result);
        // OnUpdate
        this.onUpdateHandler(i_square, result);
        this._lost_delay_count = 0;
        this._is_active=true;
        is_id_found=true;
      }
    } else {// 認識中
      if (i_marker_data==null) {
        // 認識から未認識の遷移
        this._lost_delay_count++;
        if (this._lost_delay < this._lost_delay_count) {
          // OnLeave
          this.onLeaveHandler();
          this._is_active=false;
        }
      } else if(this._data_current.isEqual(i_marker_data)) {
        //同じidの再認識
        this._transmat.transMatContinue(i_square, this._offset, result);
        // OnUpdate
        this.onUpdateHandler(i_square, result);
        this._lost_delay_count = 0;
        is_id_found=true;
      } else {// 異なるコードの認識→今はサポートしない。
        throw new  NyARException();
      }
    }
    return is_id_found;
  }
  //通知ハンドラ
  ,onEnterHandler : function(i_code)
  {
    throw new NyARException("onEnterHandler not implemented.");
  }
  ,onLeaveHandler : function()
  {
    throw new NyARException("onLeaveHandler not implemented.");
  }
  ,onUpdateHandler : function(i_square, result)
  {
    throw new NyARException("onUpdateHandler not implemented.");
  }
})














/**
 * detectMarkerのコールバック関数
 */
FLARDetectSquareCB_2 = ASKlass('DetectSquareCB',
{
  //公開プロパティ
  square : new FLARSquare()
  ,marker_data : null
  ,threshold : 0
  //参照
  ,_ref_raster : null
  //所有インスタンス
  ,_current_data : null
  ,_id_pickup : new NyIdMarkerPickup()
  ,_coordline : null
  ,_encoder : null
  ,_data_temp : null
  ,_prev_data : null
  ,DetectSquareCB : function(i_param,i_encoder)
  {
    this._coordline=new NyARCoord2Linear(i_param.getScreenSize(),i_param.getDistortionFactor());
    this._data_temp=i_encoder.createDataInstance();
    this._current_data=i_encoder.createDataInstance();
    this._encoder=i_encoder;
    return;
  }
  ,__tmp_vertex : NyARIntPoint2d.createArray(4)
  /**
  * Initialize call back handler.
  */
  ,init : function(i_raster,i_prev_data)
  {
    this.marker_data=null;
    this._prev_data=i_prev_data;
    this._ref_raster=i_raster;
  }
  ,_marker_param : new NyIdMarkerParam()
  ,_marker_data : new NyIdMarkerPattern()
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
    var patt_data=this._marker_data;
    // 評価基準になるパターンをイメージから切り出す
    if (!this._id_pickup.pickFromRaster(this._ref_raster,vertex, patt_data, param)){
      return;
    }
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
