"""
Script de prueba simple para verificar el funcionamiento del backend
"""
from database import SessionLocal
from models import Royalty, Production, Demand

def test_database():
    """Verifica que la base de datos tenga datos"""
    db = SessionLocal()
    
    try:
        # Contar registros
        royalties_count = db.query(Royalty).count()
        production_count = db.query(Production).count()
        demand_count = db.query(Demand).count()
        
        print("=" * 60)
        print("📊 ESTADO DE LA BASE DE DATOS")
        print("=" * 60)
        print(f"✅ Royalties:   {royalties_count:,} registros")
        print(f"✅ Production:  {production_count:,} registros")
        print(f"✅ Demand:      {demand_count:,} registros")
        print(f"📈 TOTAL:       {royalties_count + production_count + demand_count:,} registros")
        print("=" * 60)
        
        # Verificar datos de muestra
        if royalties_count > 0:
            sample_royalty = db.query(Royalty).first()
            print("\n🔍 MUESTRA DE REGALÍAS:")
            print(f"   - Departamento: {sample_royalty.departamento}")
            print(f"   - Municipio: {sample_royalty.municipio}")
            print(f"   - Campo: {sample_royalty.campo}")
            print(f"   - Valor: ${sample_royalty.valor_liquidado:,.2f}")
        
        if production_count > 0:
            sample_production = db.query(Production).first()
            print("\n🔍 MUESTRA DE PRODUCCIÓN:")
            print(f"   - Campo: {sample_production.campo}")
            print(f"   - Operadora: {sample_production.operadora}")
            print(f"   - Producción: {sample_production.produccion_mensual:,.2f}")
        
        if demand_count > 0:
            sample_demand = db.query(Demand).first()
            print("\n🔍 MUESTRA DE DEMANDA:")
            print(f"   - Sector: {sample_demand.sector}")
            print(f"   - Región: {sample_demand.region}")
            print(f"   - Demanda: {sample_demand.demanda:,.2f}")
        
        print("\n" + "=" * 60)
        
        # Verificar que hay datos
        assert royalties_count > 0, "❌ No hay datos de regalías"
        assert production_count > 0, "❌ No hay datos de producción"
        assert demand_count > 0, "❌ No hay datos de demanda"
        
        print("✅ TODAS LAS VERIFICACIONES PASARON")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_database()
    exit(0 if success else 1)
