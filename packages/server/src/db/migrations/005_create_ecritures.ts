import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ecritures', (table) => {
    table.string('id', 36).primary();
    table.string('import_id', 36).notNullable().references('id').inTable('imports').onDelete('CASCADE');
    table.string('fiscal_year_id', 36).notNullable().references('id').inTable('fiscal_years').onDelete('CASCADE');
    table.string('journal_code', 10).notNullable();
    table.string('journal_lib', 255).nullable();
    table.string('ecriture_num', 50).notNullable();
    table.date('ecriture_date').notNullable();
    table.string('compte_num', 20).notNullable();
    table.string('compte_lib', 255).nullable();
    table.string('compte_aux_num', 20).nullable();
    table.string('compte_aux_lib', 255).nullable();
    table.string('piece_ref', 255).nullable();
    table.date('piece_date').nullable();
    table.string('ecriture_lib', 255).nullable();
    table.decimal('debit', 15, 2).defaultTo(0);
    table.decimal('credit', 15, 2).defaultTo(0);
    table.string('ecriture_let', 20).nullable();
    table.date('date_let').nullable();
    table.date('valid_date').nullable();
    table.decimal('montant_devise', 15, 2).nullable();
    table.string('idevise', 3).nullable();
    table.integer('compte_classe').notNullable();
    table.string('compte_racine', 3).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('fiscal_year_id');
    table.index('compte_num');
    table.index('compte_classe');
    table.index('compte_racine');
    table.index('ecriture_date');
    table.index('import_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ecritures');
}
