class CreateTaxa < ActiveRecord::Migration
  def change
    create_table :taxa do |t|
      t.string :genus_name
      t.string :species_name

      t.timestamps
    end
  end
end
