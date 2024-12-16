import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView, Pressable, TextInput, Linking, Image, Modal
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { 
  Ionicons, 
  MaterialIcons, 
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons';
import Checkbox from 'expo-checkbox'; 

const supabaseUrl = 'http://164.90.253.185:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzI3OTI0NDAwLAogICJleHAiOiAxODg1NjkwODAwCn0.l6dhuDeAu9qg7mvocRfBqKGHoksn2H6kqSqlGqSKAsA';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function HomeScreen() {
  const [data, setData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("initial"); 
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterPlate, setFilterPlate] = useState("");
  const [page, setPage] = useState(1);
  const [filterRenavam, setFilterRenavam] = useState("");
  const LIMIT = 9;
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterPago, setFilterPago] = useState("");

  const [showGerarPixModal, setShowGerarPixModal] = useState(false);
  const [pixValor, setPixValor] = useState("");
  const [pixNome, setPixNome] = useState("");
  const [pixObservacao, setPixObservacao] = useState("");
  const [selectedInfraction, setSelectedInfraction] = useState(null);

  const userName = "RODRIGO DA SILVA LOPES (CASHLY LTDA)";

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const oneMonthAgoISO = oneMonthAgo.toISOString();
  
      const { data: vehicles, error } = await supabase
        .from("multas_teste")
        .select("placa_carro, data_infracao, tipo, pix_enviado, pago_check")
        .gte("data_infracao", oneMonthAgoISO)
        .order("data_infracao", { ascending: true });
        
      if (error) {
        console.error("Erro ao buscar dados:", error.message);
      } else {
        setData(vehicles);
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchVehicles = async (withFilter = false) => {
    setLoading(true);
    let query = supabase
      .from("veiculos")
      .select("combustivel, ano_modelo, cor, ano_fabricacao, marca_modelo, placa_carro, renavam, crlv");

    if (withFilter) {
      if (filterPlate.trim() !== "") {
        query = query.eq("placa_carro", filterPlate.toUpperCase());
      }
      if (filterRenavam.trim() !== "") {
        query = query.eq("renavam", filterRenavam);
      }
    }

    try {
      const { data: veiculos, error } = await query;
      if (error) {
        console.error("Erro ao buscar veículos:", error.message);
      } else {
        setVehicleData(veiculos);
        setViewMode("vehicles");
        setPage(1);
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfractions = async () => {
    setLoading(true);
    try {
      const { data: infractions, error } = await supabase
        .from("multas_teste")
        .select("*"); 
      if (error) {
        console.error("Erro ao buscar infrações:", error.message);
      } else {
        setData(infractions);
        setViewMode("infractions");
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredInfractions = async () => {
    setLoading(true);
    try {
      let query = supabase.from("multas_teste").select("*");
      
      if (startDate.trim() !== "") {
        query = query.gte("data_infracao", startDate);
      }
      if (endDate.trim() !== "") {
        query = query.lte("data_infracao", endDate);
      }

      if (filterPago === "Pago") {
        query = query.eq("pago_check", "Pago");
      } else if (filterPago === "NaoPago") {
        query = query.neq("pago_check", "Pago");
      }

      query = query.order("data_infracao", { ascending: false });

      const { data: infractions, error } = await query;

      if (error) {
        console.error("Erro ao buscar infrações filtradas:", error.message);
      } else {
        setData(infractions);
        setViewMode("infractions");
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchData();
  }, []);

  const handleBack = () => {
    if (viewMode === "details" || viewMode === "infractions" || viewMode === "user") {
      setSelectedVehicle(null);
      setViewMode("initial");
      setStartDate("");
      setEndDate("");
      setFilterPago("");
    } else {
      setVehicleData([]);
      setViewMode("initial");
      setFilterPlate("");
      setFilterRenavam("");
      setStartDate("");
      setEndDate("");
      setFilterPago("");
    }
  };

  const handleFilter = () => {
    fetchVehicles(true);
  };

  const handleClearFilter = () => {
    setFilterPlate("");
    setFilterRenavam("");
    fetchVehicles(false);
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setViewMode("details");
  };

  // Ao clicar em "Gerar Pix" na tabela
  const handleGerarPixClick = (item) => {
    setSelectedInfraction(item); // guardamos a infração para qual iremos gerar o pix
    setShowGerarPixModal(true);
  };

  // Função que seria chamada ao clicar em "Gerar Pix" no modal
  const handleGerarPix = async () => {
    // Aqui você pode implementar a lógica de gerar o Pix.
    // Por exemplo, salvar no banco de dados, gerar um link, etc.

    // Exemplo fictício: inserir um valor no campo pix_enviado da infração no banco (adaptar conforme a sua tabela)
    // Atualizar o registro da multa no supabase
    if (selectedInfraction) {
      const { data: updatedData, error } = await supabase
        .from("multas_teste")
        .update({
          pix_enviado: "https://link-do-pix-gerado.com", // Exemplo de link gerado
          // Outros campos do Pix podem ser salvos aqui também, ex: valor_pix, nome_pagador, etc.
        })
        .eq('placa_carro', selectedInfraction.placa_carro); // Ajustar a condição conforme sua tabela

      if (error) {
        console.error("Erro ao atualizar pix:", error);
      } else {
        // Fechar modal
        setShowGerarPixModal(false);
        setSelectedInfraction(null);
        setPixValor("");
        setPixNome("");
        setPixObservacao("");

        // Recarregar dados para atualizar a tela
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      {/* Modal para gerar Pix */}
      <Modal
        transparent={true}
        visible={showGerarPixModal}
        animationType="fade"
        onRequestClose={() => setShowGerarPixModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Gerar Pix</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Valor do Pix"
              keyboardType="numeric"
              value={pixValor}
              onChangeText={setPixValor}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do Pagador"
              value={pixNome}
              onChangeText={setPixNome}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Observação"
              value={pixObservacao}
              onChangeText={setPixObservacao}
            />
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
              <Pressable style={[styles.closeButton, {backgroundColor:'#aaa'}]} onPress={() => setShowGerarPixModal(false)}>
                <Text style={styles.closeButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={handleGerarPix}>
                <Text style={styles.closeButtonText}>Gerar Pix</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../logos/cashly_fundo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.mainContainer}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.menuTitle}>Menu</Text>
          <View style={styles.menuItem}>
            <Ionicons name="person-outline" size={20} color="#F5F5F5" style={styles.menuIcon}/>
            <Text style={styles.menuText}>Usuário</Text>
          </View>
          <View style={styles.menuItem}>
            <Ionicons name="car-outline" size={20} color="#F5F5F5" style={styles.menuIcon}/>
            <Text style={styles.menuText}>Veículos</Text>
          </View>
          <View style={styles.menuItem}>
            <MaterialIcons name="gavel" size={20} color="#F5F5F5" style={styles.menuIcon}/>
            <Text style={styles.menuText}>Infrações</Text>
          </View>
          <View style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color="#F5F5F5" style={styles.menuIcon}/>
            <Text style={styles.menuText}>Ajuda</Text>
          </View>
        </View>

        {/* Conteúdo principal */}
        <View style={styles.contentContainer}>
          <ScrollView style={{flex: 1}}>
          {viewMode === "initial" && (
            <>
              <Text style={styles.welcomeText}>Olá {userName}, o que você deseja ver hoje?</Text>
              
              {/* Cards iniciais */}
              <View style={styles.cardRow}>
                <Pressable style={styles.infoCard} onPress={() => fetchVehicles(false)}>
                  <Ionicons name="car" size={50} color="#F5F5F5" style={{marginBottom:10}}/>
                  <Text style={styles.cardTitle}>VEÍCULOS</Text>
                </Pressable>

                <Pressable style={styles.infoCard} onPress={fetchInfractions}>
                  <MaterialIcons name="attach-money" size={50} color="#F5F5F5" style={{marginBottom:10}}/>
                  <Text style={styles.cardTitle}>INFRAÇÕES</Text>
                </Pressable>

                <Pressable style={styles.infoCard} onPress={() => setViewMode("user")}>
                  <Entypo name="user" size={50} color="#F5F5F5" style={{marginBottom:10}}/>
                  <Text style={styles.cardTitle}>MOTORISTA</Text>
                </Pressable>
              </View>

              {/* Tabela com lista de veículos e infrações */}
              <Text style={styles.sectionTitle}>Lista de Veículos e Infrações</Text>
              {data.length === 0 ? (
                <Text style={styles.noDataText}>Nenhum dado encontrado.</Text>
              ) : (
                <View style={styles.tableContainer}>
                  {/* Cabeçalho da tabela */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerText}>Placa</Text>
                    <Text style={styles.headerText}>Tipo de Multa</Text>
                    <Text style={styles.headerText}>Data da Infração</Text>
                    <Text style={styles.headerText}>Pix Enviado</Text>
                    <Text style={styles.headerText}>Pago</Text>
                  </View>
                  
                  {/* Corpo da tabela */}
                  <FlatList
                    data={data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.tableRow}>
                        <Text style={styles.rowText}>{item.placa_carro}</Text>
                        <Text style={styles.rowText}>{item.tipo}</Text>
                        <Text style={styles.rowText}>{item.data_infracao}</Text>
                        
                        {/* Botão "Gerar Pix" se não tiver pix_enviado */}
                        <View style={{flex:0.2, justifyContent: 'center', alignItems:'center'}}>
                          {!item.pix_enviado ? (
                            <Pressable 
                              style={styles.gerarPixButton}
                              onPress={() => handleGerarPixClick(item)}
                            >
                              <Text style={styles.gerarPixButtonText}>Gerar Pix</Text>
                            </Pressable>
                          ) : (
                            // Se já houver pix_enviado, exibe algo diferente, ex: "Já gerado"
                            <Text style={styles.rowText}>Já gerado</Text>
                          )}
                        </View>

                        {/* Pago Check */}
                        <View style={{flex:0.2, justifyContent: 'center', alignItems:'center'}}>
                          <Checkbox
                            value={item.pago_check === "Pago"}
                            onValueChange={() => {}}
                            color={item.pago_check === "Pago" ? "#059A05" : undefined}
                          />
                        </View>
                      </View>
                    )}
                  />
                </View>
              )}
            </>
          )}

          {viewMode === "vehicles" && (
            <>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>

              <Text style={styles.selectionTitle}>SELECIONE UM VEÍCULO PARA CONSULTAR AS INFORMAÇÕES:</Text>

              <View style={styles.filterRow}>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="card-text-outline" size={20} color="#492065" style={{marginRight:5}}/>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Placa"
                    value={filterPlate}
                    onChangeText={setFilterPlate}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="car-outline" size={20} color="#492065" style={{marginRight:5}}/>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Renavam"
                    value={filterRenavam}
                    onChangeText={setFilterRenavam}
                  />
                </View>

                <Pressable style={styles.filterButton} onPress={handleFilter}>
                  <Text style={styles.filterButtonText}>Filtrar</Text>
                </Pressable>
                <Pressable style={styles.clearButton} onPress={handleClearFilter}>
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </Pressable>
              </View>

              {vehicleData.length === 0 ? (
                <Text style={styles.noDataText}>Nenhum veículo encontrado.</Text>
              ) : (
                <>
                  {(() => {
                    const totalPages = Math.ceil(vehicleData.length / LIMIT);
                    const paginatedData = vehicleData.slice((page - 1) * LIMIT, page * LIMIT);

                    return (
                      <>
                        <FlatList
                          data={paginatedData}
                          keyExtractor={(item, index) => index.toString()}
                          contentContainerStyle={styles.vehicleListContainer}
                          renderItem={({ item }) => (
                            <Pressable style={styles.vehicleCard} onPress={() => handleSelectVehicle(item)}>
                              <Text style={styles.vehiclePlate}>
                                <MaterialCommunityIcons name="card-text-outline" size={28} color="#492065" /> {item.placa_carro}
                              </Text>
                              {item.renavam && (
                                <Text style={styles.vehicleRenavam}>
                                  <MaterialCommunityIcons name="car" size={36} color="#492065" /> {item.renavam}
                                </Text>
                              )}
                            </Pressable>
                          )}
                          horizontal={false}
                          numColumns={3}
                        />

                        {/* Botões de Paginação */}
                        <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 20}}>
                          {page > 1 && (
                            <Pressable
                              style={[styles.filterButton, {marginRight:10}]}
                              onPress={() => setPage(page - 1)}
                            >
                              <Text style={styles.filterButtonText}>Página Anterior</Text>
                            </Pressable>
                          )}

                          <Text style={{alignSelf: 'center', marginHorizontal: 10, fontWeight: 'bold'}}>
                            Página {page} de {totalPages}
                          </Text>

                          {page < totalPages && (
                            <Pressable
                              style={[styles.filterButton, {marginLeft:10}]}
                              onPress={() => setPage(page + 1)}
                            >
                              <Text style={styles.filterButtonText}>Próxima Página</Text>
                            </Pressable>
                          )}
                        </View>
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {viewMode === "infractions" && (
            <>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>

              <Text style={styles.selectionTitle}>Lista de Infrações</Text>

              {/* Filtro por data e por pagamento */}
              <View style={styles.filterContainer}>
                <View style={styles.dateFilter}>
                  <Text style={styles.filterLabel}>Data Inicial:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>

                <View style={styles.dateFilter}>
                  <Text style={styles.filterLabel}>Data Final:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>

                <View style={styles.dateFilter}>
                  <Text style={styles.filterLabel}>Pago:</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="Digite Pago ou NaoPago (ou deixe vazio)"
                    value={filterPago}
                    onChangeText={setFilterPago}
                  />
                </View>

                <Pressable style={styles.filterButton} onPress={fetchFilteredInfractions}>
                  <Text style={styles.filterButtonText}>Filtrar</Text>
                </Pressable>
              </View>

              {data.length === 0 ? (
                <Text style={styles.noDataText}>Nenhuma infração encontrada.</Text>
              ) : (
                <FlatList
                  data={data}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={styles.infractionListContainer}
                  renderItem={({ item }) => (
                    <View style={styles.infractionItemDetails}>
                      <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Placa:</Text> {item.placa_carro}</Text>
                      <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Tipo de Multa:</Text> {item.tipo}</Text>
                      <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Data da Infração:</Text> {item.data_infracao}</Text>
                      <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Status:</Text> {item.pago_check === "Pago" ? "Pago" : "Não Pago"}</Text>
                    </View>
                  )}
                />
              )}
            </>
          )}

          {viewMode === "user" && (
            <>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>

              <Text style={styles.detailsTitle}>Informações do Usuário</Text>

              <View style={styles.detailsCard}>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Nome:</Text> {userName}</Text>
              </View>
            </>
          )}

          {viewMode === "details" && selectedVehicle && (
            <>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>
              <Text style={styles.detailsTitle}>Detalhes do Veículo</Text>

              <View style={styles.detailsCard}>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Placa Atual:</Text> {selectedVehicle.placa_carro}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Renavam:</Text> {selectedVehicle.renavam || "N/A"}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Combustível:</Text> {selectedVehicle.combustivel || "N/A"}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Ano Modelo:</Text> {selectedVehicle.ano_modelo || "N/A"}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Cor:</Text> {selectedVehicle.cor || "N/A"}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Ano Fabricação:</Text> {selectedVehicle.ano_fabricacao || "N/A"}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>Marca/Modelo:</Text> {selectedVehicle.marca_modelo || "N/A"}</Text>
                <Text style={styles.detailsItem}><Text style={styles.detailsLabel}>CRLV:</Text> {selectedVehicle.crlv || "N/A"}</Text>

                {selectedVehicle.crlv && (
                  <Pressable style={styles.pdfButton} onPress={() => Linking.openURL(selectedVehicle.crlv)}>
                    <Text style={styles.pdfButtonText}>Ver CRLV</Text>
                  </Pressable>
                )}

                <Text style={styles.detailsWarning}>
                  Atenção: As informações obtidas são apenas para consulta, não servem como certidão de regularidade.
                </Text>
              </View>
            </>
          )}

          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: {width:0, height:2},
    shadowRadius: 4,
  },
  logo: {
    width: 150, 
    height: 50,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },  
  headerTitle: {
    color: "#492065",
    fontSize: 20,
    fontWeight: "bold",
  },
  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 200,
    backgroundColor: "#492065",
    paddingTop: 20,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 20,
    color: "#FF00B0" 
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 20,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold", 
    color: "#1E1E1E",
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 30,
  },
  infoCard: {
    width: 150,
    height: 150,
    backgroundColor: "#492065",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#E6EBF6",
    shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#E6EBF6",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold", 
    color: "#F5F5F5",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 10,
    marginTop: 30,
  },
  noDataText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 50,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 20,
  },
  vehicleListContainer: {
    paddingBottom: 20,
  },
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    margin: 10,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: "center",
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: "bold", 
    marginBottom: 10,
    color: "#492065",
  },
  vehicleRenavam: {
    fontSize: 16,
    marginBottom: 10,
    color: "#492065",
  },
  backButton: {
    backgroundColor: "#C10E73",
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold", 
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 35,
  },
  filterInput: {
    flex: 1,
    height: "100%",
  },
  filterButton: {
    backgroundColor: "#96D858",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  filterButtonText: {
    color: "#F5F5F5",
    fontWeight: "bold", 
  },
  clearButton: {
    backgroundColor: "#EA5356",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },
  clearButtonText: {
    color: "#F5F5F5",
    fontWeight: "bold", 
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsItem: {
    fontSize: 14,
    marginBottom: 10,
    color: "#333",
  },
  detailsLabel: {
    fontWeight: "bold",
  },
  detailsWarning: {
    marginTop: 20,
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
  },
  pdfButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 15,  
    borderRadius: 4,
    marginTop: 20,
    alignSelf: "flex-start",
  },
  pdfButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  infractionListContainer: {
    paddingBottom: 20,
  },
  infractionItemDetails: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#E6EBF6",
    shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E6EBF6",
    borderRadius: 8,
    marginVertical: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E6EBF6",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    height: 30,
    alignItems: "center",
  },
  headerText: {
    flex: 0.2,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
    color: "#492065",
    paddingHorizontal: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#E6EBF6",
    height: 40, 
    alignItems: "center",
    paddingHorizontal:5
  },
  rowText: {
    flex: 0.2,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
    paddingHorizontal: 2,
  },
  gerarPixButton: {
    backgroundColor: "#C10E73",
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal:10
  },
  gerarPixButtonText: {
    color:"#fff",
    fontWeight:"bold"
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 5,
    color: "#333",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 35,
    width: 120,
    marginRight: 10,
  },
  modalBackground: {
    flex:1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalContainer:{
    backgroundColor:'#fff',
    width:300,
    borderRadius:8,
    padding:20,
    alignItems:'center'
  },
  modalTitle:{
    fontWeight:'bold',
    fontSize:18,
    marginBottom:10
  },
  modalInput:{
    width:'100%',
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:4,
    padding:10,
    marginBottom:10
  },
  closeButton:{
    backgroundColor:'#C10E73',
    paddingHorizontal:20,
    paddingVertical:8,
    borderRadius:4
  },
  closeButtonText:{
    color:'#fff',
    fontWeight:'bold'
  }
});
