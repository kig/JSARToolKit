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
NyARCustomSingleDetectMarker = ASKlass('NyARCustomSingleDetectMarker',
{
  _is_continue : false,
  _square_detect : null,
  _transmat : null,
  //画処理用
  _bin_raster : null,
  _tobin_filter : null,
  _detect_cb : null,
  _offset : null,
  NyARCustomSingleDetectMarker : function()
  {
    return;
  }
  ,initInstance : function(
    i_patt_inst,
    i_sqdetect_inst,
    i_transmat_inst,
    i_filter,
    i_ref_param,
    i_ref_code,
    i_marker_width)
  {
    var scr_size=i_ref_param.getScreenSize();
    // 解析オブジェクトを作る
    this._square_detect = i_sqdetect_inst;
    this._transmat = i_transmat_inst;
    this._tobin_filter=i_filter;
    //２値画像バッファを作る
    this._bin_raster=new NyARBinRaster(scr_size.w,scr_size.h);
    //_detect_cb
    this._detect_cb=new DetectSquareCB_3(i_patt_inst,i_ref_code,i_ref_param);
    //オフセットを作成
    this._offset=new NyARRectOffset();
    this._offset.setSquare(i_marker_width);
    return;
  }
  /**
   * i_imageにマーカー検出処理を実行し、結果を記録します。
   *
   * @param i_raster
   * マーカーを検出するイメージを指定します。イメージサイズは、カメラパラメータ
   * と一致していなければなりません。
   * @return マーカーが検出できたかを真偽値で返します。
   * @throws NyARException
   */
  ,detectMarkerLiteB : function(i_raster)    {
    //サイズチェック
    if(!this._bin_raster.getSize().isEqualSize_NyARIntSize(i_raster.getSize())){
      throw new NyARException();
    }
    //ラスタを２値イメージに変換する.
    this._tobin_filter.doFilter(i_raster,this._bin_raster);
    //コールバックハンドラの準備
    this._detect_cb.init(i_raster);
    //矩形を探す(戻り値はコールバック関数で受け取る。)
    this._square_detect.detectMarkerCB(this._bin_raster,_detect_cb);
    if(this._detect_cb.confidence==0){
      return false;
    }
    return true;
  }
  /**
   * 検出したマーカーの変換行列を計算して、o_resultへ値を返します。
   * 直前に実行したdetectMarkerLiteが成功していないと使えません。
   *
   * @param o_result
   * 変換行列を受け取るオブジェクトを指定します。
   * @throws NyARException
   */
  ,getTransmationMatrix : function(o_result)
  {
    // 一番一致したマーカーの位置とかその辺を計算
    if (this._is_continue) {
      this._transmat.transMatContinue(this._detect_cb.square,this._offset, o_result);
    } else {
      this._transmat.transMat(this._detect_cb.square,this._offset, o_result);
    }
    return;
  }
  /**
   * 現在の矩形を返します。
   * @return
   */
  ,refSquare : function()
  {
    return this._detect_cb.square;
  }
  /**
   * 検出したマーカーの一致度を返します。
   *
   * @return マーカーの一致度を返します。0～1までの値をとります。 一致度が低い場合には、誤認識の可能性が高くなります。
   * @throws NyARException
   */
  ,getConfidence : function()
  {
    return this._detect_cb.confidence;
  }
  /**
   * getTransmationMatrixの計算モードを設定します。 初期値はTRUEです。
   *
   * @param i_is_continue
   * TRUEなら、transMatCont互換の計算をします。 FALSEなら、transMat互換の計算をします。
   */
  ,setContinueMode : function(i_is_continue)
  {
    this._is_continue = i_is_continue;
  }
})










/**
 * detectMarkerのコールバック関数
 */
DetectSquareCB_3 = ASKlass('DetectSquareCB', NyARSquareContourDetector_IDetectMarkerCallback,
{
  //公開プロパティ
  confidence : 0,
  square : new NyARSquare(),
  //参照インスタンス
  _ref_raster : null,
  //所有インスタンス
  _inst_patt : null,
  _deviation_data : null,
  _match_patt : null,
  __detectMarkerLite_mr : new NyARMatchPattResult(),
  _coordline : null,
  DetectSquareCB : function(i_inst_patt,i_ref_code,i_param)
  {
    this._inst_patt=i_inst_patt;
    this._deviation_data=new NyARMatchPattDeviationColorData(i_ref_code.getWidth(),i_ref_code.getHeight());
    this._coordline=new NyARCoord2Linear(i_param.getScreenSize(),i_param.getDistortionFactor());
    this._match_patt=new NyARMatchPatt_Color_WITHOUT_PCA(i_ref_code);
    return;
  },
  __tmp_vertex : NyARIntPoint2d.createArray(4),
  /**
  * 矩形が見付かるたびに呼び出されます。
  * 発見した矩形のパターンを検査して、方位を考慮した頂点データを確保します。
  */
  onSquareDetect : function(i_sender,i_coordx,i_coordy,i_coor_num,i_vertex_index)
  {
    var i;
    var mr=this.__detectMarkerLite_mr;
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
      return;
    }
    //取得パターンをカラー差分データに変換して評価する。
    this._deviation_data.setRaster(this._inst_patt);
    if(!this._match_patt.evaluate(this._deviation_data,mr)){
      return;
    }
    //現在の一致率より低ければ終了
    if (this.confidence > mr.confidence){
      return;
    }
    //一致率の高い矩形があれば、方位を考慮して頂点情報を作成
    var sq=this.square;
    this.confidence = mr.confidence;
    //directionを考慮して、squareを更新する。
    for(i=0;i<4;i++){
      var idx=(i+4 - mr.direction) % 4;
      this._coordline.coord2Line(i_vertex_index[idx],i_vertex_index[(idx+1)%4],i_coordx,i_coordy,i_coor_num,sq.line[i]);
    }
    for (i = 0; i < 4; i++) {
      //直線同士の交点計算
      if(!NyARLinear.crossPos(sq.line[i],sq.line[(i + 3) % 4],sq.sqvertex[i])){
        throw new NyARException();//ここのエラー復帰するならダブルバッファにすればOK
      }
    }
  }
  ,init : function(i_raster)
  {
    this.confidence=0;
    this._ref_raster=i_raster;
  }
})










/**
 * 複数のマーカーを検出し、それぞれに最も一致するARコードを、コンストラクタで登録したARコードから 探すクラスです。最大300個を認識しますが、ゴミラベルを認識したりするので100個程度が限界です。
 *
 */
NyARDetectMarker = ASKlass('NyARDetectMarker',
{
  _detect_cb : null,
  AR_SQUARE_MAX : 300,
  _is_continue : false,
  _square_detect : null,
  _transmat : null,
  _offset : null,
  /**
   * 複数のマーカーを検出し、最も一致するARCodeをi_codeから検索するオブジェクトを作ります。
   *
   * @param i_param
   * カメラパラメータを指定します。
   * @param i_code
   * 検出するマーカーのARCode配列を指定します。
   * 配列要素のインデックス番号が、そのままgetARCodeIndex関数で得られるARCodeインデックスになります。
   * 例えば、要素[1]のARCodeに一致したマーカーである場合は、getARCodeIndexは1を返します。
   * @param i_marker_width
   * i_codeのマーカーサイズをミリメートルで指定した配列を指定します。 先頭からi_number_of_code個の要素には、有効な値を指定する必要があります。
   * @param i_number_of_code
   * i_codeに含まれる、ARCodeの数を指定します。
   * @param i_input_raster_type
   * 入力ラスタのピクセルタイプを指定します。この値は、INyARBufferReaderインタフェイスのgetBufferTypeの戻り値を指定します。
   * @throws NyARException
   */
  NyARDetectMarker : function(i_param, i_code, i_marker_width, i_number_of_code, i_input_raster_type)
  {
    this.initInstance(i_param,i_code,i_marker_width,i_number_of_code,i_input_raster_type);
    return;
  }
  ,initInstance : function(
    i_ref_param,
    i_ref_code,
    i_marker_width,
    i_number_of_code,
    i_input_raster_type)
  {
    var scr_size=i_ref_param.getScreenSize();
    // 解析オブジェクトを作る
    var cw = i_ref_code[0].getWidth();
    var ch = i_ref_code[0].getHeight();
    //detectMarkerのコールバック関数
    this._detect_cb=new NyARDetectSquareCB(
      new NyARColorPatt_Perspective_O2(cw, ch,4,25),
      i_ref_code,i_number_of_code,i_ref_param);
    this._transmat = new NyARTransMat(i_ref_param);
    //NyARToolkitプロファイル
    this._square_detect =new NyARSquareContourDetector_Rle(i_ref_param.getScreenSize());
    this._tobin_filter=new NyARRasterFilter_ARToolkitThreshold(100,i_input_raster_type);
    //実サイズ保存
    this._offset = NyARRectOffset.createArray(i_number_of_code);
    for(var i=0;i<i_number_of_code;i++){
      this._offset[i].setSquare(i_marker_width[i]);
    }
    //２値画像バッファを作る
    this._bin_raster=new NyARBinRaster(scr_size.w,scr_size.h);
    return;
  },
  _bin_raster : null,
  _tobin_filter : null,
  /**
   * i_imageにマーカー検出処理を実行し、結果を記録します。
   *
   * @param i_raster
   * マーカーを検出するイメージを指定します。
   * @param i_thresh
   * 検出閾値を指定します。0～255の範囲で指定してください。 通常は100～130くらいを指定します。
   * @return 見つかったマーカーの数を返します。 マーカーが見つからない場合は0を返します。
   * @throws NyARException
   */
  detectMarkerLite : function(i_raster,i_threshold)
  {
    // サイズチェック
    if (!this._bin_raster.getSize().isEqualSize_NyARIntSize(i_raster.getSize())) {
      throw new NyARException();
    }
    // ラスタを２値イメージに変換する.
    (NyARRasterFilter_ARToolkitThreshold(this._tobin_filter)).setThreshold(i_threshold);
    this._tobin_filter.doFilter(i_raster, this._bin_raster);
    //detect
    this._detect_cb.init(i_raster);
    this._square_detect.detectMarkerCB(this._bin_raster,this._detect_cb);
    //見付かった数を返す。
    return this._detect_cb.result_stack.getLength();
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
  ,getTransmationMatrix : function(i_index, o_result)
  {
    var result = this._detect_cb.result_stack.getItem(i_index);
    // 一番一致したマーカーの位置とかその辺を計算
    if (_is_continue) {
      _transmat.transMatContinue(result.square, this._offset[result.arcode_id], o_result);
    } else {
      _transmat.transMat(result.square, this._offset[result.arcode_id], o_result);
    }
    return;
  }
  /**
   * i_indexのマーカーの一致度を返します。
   *
   * @param i_index
   * マーカーのインデックス番号を指定します。 直前に実行したdetectMarkerLiteの戻り値未満かつ0以上である必要があります。
   * @return マーカーの一致度を返します。0～1までの値をとります。 一致度が低い場合には、誤認識の可能性が高くなります。
   * @throws NyARException
   */
  ,getConfidence : function(i_index)
  {
    return this._detect_cb.result_stack.getItem(i_index).confidence;
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
    return this._detect_cb.result_stack.getItem(i_index).arcode_id;
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
})

NyARDetectMarkerResult = ASKlass('NyARDetectMarkerResult',
{
  arcode_id : 0,
  confidence : 0,
  square : new NyARSquare()
})

NyARDetectMarkerResultStack = ASKlass('NyARDetectMarkerResultStack ', NyARObjectStack,
{
  NyARDetectMarkerResultStack : function(i_length)
  {
    NyARObjectStack.initialize.call(this, i_length);
  }
  ,createArray : function(i_length)
  {
    var ret= new Array(i_length);
    for (var i =0; i < i_length; i++){
      ret[i] = new NyARDetectMarkerResult();
    }
    return (ret);
  }
})














NyARDetectSquareCB = ASKlass('NyARDetectSquareCB ', NyARSquareContourDetector_IDetectMarkerCallback,
{
  //公開プロパティ
  result_stack : new NyARDetectMarkerResultStack(NyARDetectMarker.AR_SQUARE_MAX),
  //参照インスタンス
  _ref_raster : null,
  //所有インスタンス
  _inst_patt : null,
  _deviation_data : null,
  _match_patt : null,
  __detectMarkerLite_mr : new NyARMatchPattResult(),
  _coordline : null,
  NyARDetectSquareCB : function(i_inst_patt, i_ref_code, i_num_of_code, i_param)
  {
    var cw = i_ref_code[0].getWidth();
    var ch = i_ref_code[0].getHeight();
    this._inst_patt=i_inst_patt;
    this._coordline=new NyARCoord2Linear(i_param.getScreenSize(),i_param.getDistortionFactor());
    this._deviation_data=new NyARMatchPattDeviationColorData(cw,ch);
    //NyARMatchPatt_Color_WITHOUT_PCA[]の作成
    this._match_patt=new Array(i_num_of_code);
    this._match_patt[0]=new NyARMatchPatt_Color_WITHOUT_PCA(i_ref_code[0]);
    for (var i = 1; i < i_num_of_code; i++){
      //解像度チェック
      if (cw != i_ref_code[i].getWidth() || ch != i_ref_code[i].getHeight()) {
        throw new NyARException();
      }
      this._match_patt[i]=new NyARMatchPatt_Color_WITHOUT_PCA(i_ref_code[i]);
    }
    return;
  },
  __tmp_vertex : NyARIntPoint2d.createArray(4),
  /**
   * 矩形が見付かるたびに呼び出されます。
   * 発見した矩形のパターンを検査して、方位を考慮した頂点データを確保します。
   */
  onSquareDetect : function(i_sender,i_coordx,i_coordy,i_coor_num ,i_vertex_index)
  {
    var mr=this.__detectMarkerLite_mr;
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
      return;
    }
    //取得パターンをカラー差分データに変換して評価する。
    this._deviation_data.setRaster(this._inst_patt);
    //最も一致するパターンを割り当てる。
    var square_index,direction;
    var confidence;
    this._match_patt[0].evaluate(this._deviation_data,mr);
    square_index=0;
    direction=mr.direction;
    confidence=mr.confidence;
    //2番目以降
    var i;
    for(i=1;i<this._match_patt.length;i++){
      this._match_patt[i].evaluate(this._deviation_data,mr);
      if (confidence > mr.confidence) {
        continue;
      }
      // もっと一致するマーカーがあったぽい
      square_index = i;
      direction = mr.direction;
      confidence = mr.confidence;
    }
    //最も一致したマーカ情報を、この矩形の情報として記録する。
    var result = this.result_stack.prePush();
    result.arcode_id = square_index;
    result.confidence = confidence;
    var sq=result.square;
    //directionを考慮して、squareを更新する。
    for(i=0;i<4;i++){
      var idx=(i+4 - direction) % 4;
      this._coordline.coord2Line(i_vertex_index[idx],i_vertex_index[(idx+1)%4],i_coordx,i_coordy,i_coor_num,sq.line[i]);
    }
    for (i = 0; i < 4; i++) {
      //直線同士の交点計算
      if(!NyARLinear.crossPos(sq.line[i],sq.line[(i + 3) % 4],sq.sqvertex[i])){
        throw new NyARException();//ここのエラー復帰するならダブルバッファにすればOK
      }
    }
  }
  ,init : function(i_raster)
  {
    this._ref_raster=i_raster;
    this.result_stack.clear();
  }
})










/**
 * 画像からARCodeに最も一致するマーカーを1個検出し、その変換行列を計算するクラスです。
 *
 */
NyARSingleDetectMarker = ASKlass('NyARSingleDetectMarker', NyARCustomSingleDetectMarker,
{
  PF_ARTOOLKIT_COMPATIBLE : 1,
  PF_NYARTOOLKIT : 2,
  PF_NYARTOOLKIT_ARTOOLKIT_FITTING : 100,
  PF_TEST2 : 201,
  /**
  * 検出するARCodeとカメラパラメータから、1個のARCodeを検出するNyARSingleDetectMarkerインスタンスを作ります。
  *
  * @param i_param
  * カメラパラメータを指定します。
  * @param i_code
  * 検出するARCodeを指定します。
  * @param i_marker_width
  * ARコードの物理サイズを、ミリメートルで指定します。
  * @param i_input_raster_type
  * 入力ラスタのピクセルタイプを指定します。この値は、INyARBufferReaderインタフェイスのgetBufferTypeの戻り値を指定します。
  * @throws NyARException
  */
  NyARSingleDetectMarker : function(i_param,i_code,i_marker_width,i_input_raster_type,i_profile_id)
  {
    if (i_profile_id == null) i_profile_id = this.PF_NYARTOOLKIT;
    NyARCustomSingleDetectMarker.initialize.call(this);
    this.initInstance2(i_param,i_code,i_marker_width,i_input_raster_type,i_profile_id);
    return;
  }
  /**
  * コンストラクタから呼び出す関数です。
  * @param i_ref_param
  * @param i_ref_code
  * @param i_marker_width
  * @param i_input_raster_type
  * @param i_profile_id
  * @throws NyARException
  */
  ,initInstance2 : function(
    i_ref_param,
    i_ref_code,
    i_marker_width,
    i_input_raster_type,
    i_profile_id)
  {
    var th=new NyARRasterFilter_ARToolkitThreshold(100,i_input_raster_type);
    var patt_inst;
    var sqdetect_inst;
    var transmat_inst;
    switch(i_profile_id){
    case this.PF_NYARTOOLKIT://default
      patt_inst=new NyARColorPatt_Perspective_O2(i_ref_code.getWidth(), i_ref_code.getHeight(),4,25);
      sqdetect_inst=new NyARSquareContourDetector_Rle(i_ref_param.getScreenSize());
      transmat_inst=new NyARTransMat(i_ref_param);
      break;
    default:
      throw new NyARException();
    }
    NyARCustomSingleDetectMarker.initInstance.call(this,patt_inst,sqdetect_inst,transmat_inst,th,i_ref_param,i_ref_code,i_marker_width);
  }
  /**
  * i_imageにマーカー検出処理を実行し、結果を記録します。
  *
  * @param i_raster
  * マーカーを検出するイメージを指定します。イメージサイズは、コンストラクタで指定i_paramの
  * スクリーンサイズと一致し、かつi_input_raster_typeに指定した形式でなければいけません。
  * @return マーカーが検出できたかを真偽値で返します。
  * @throws NyARException
  */
  ,detectMarkerLite : function(i_raster,i_threshold)
  {
    (NyARRasterFilter_ARToolkitThreshold(this._tobin_filter)).setThreshold(i_threshold);
    return NyARCustomSingleDetectMarker.detectMarkerLiteB.call(this,i_raster);
  }
})

